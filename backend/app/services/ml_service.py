import joblib
import pandas as pd
import numpy as np
import os
import re
from app.config import get_settings
from app.models.logs import APILogRequest, RiskAssessment, RiskLevel

settings = get_settings()

# ─── OWASP API Top 10 Mapping ────────────────────────────────
OWASP_MAP = {
    "SQL Injection": "API8: Injection",
    "Cross-Site Scripting (XSS)": "API8: Injection",
    "Broken Authentication": "API2: Broken Authentication",
    "Sensitive Data Exposure": "API3: Excessive Data Exposure",
    "Insecure Direct Object Reference (IDOR)": "API1: Broken Object Level Authorization",
    "Suspicious Token Exposure": "API3: Excessive Data Exposure",
    "Missing Authentication": "API2: Broken Authentication",
    "Parameter Tampering": "API5: Broken Function Level Authorization",
    "General Anomaly": "API9: Improper Assets Management",
}

# ─── Pattern Definitions ─────────────────────────────────────
SQL_PATTERNS = re.compile(
    r"(select\s|insert\s|update\s|delete\s|drop\s|union\s|alter\s|exec\s|"
    r"execute\s|xp_|sp_|0x|char\(|concat\(|benchmark\(|sleep\(|waitfor\s|"
    r"or\s+1\s*=\s*1|'\s*or\s*'|--\s|;\s*drop|;\s*select|having\s+1\s*=\s*1)",
    re.IGNORECASE,
)

XSS_PATTERNS = re.compile(
    r"(<script|javascript:|onerror\s*=|onload\s*=|onclick\s*=|onfocus\s*=|"
    r"onmouseover\s*=|<iframe|<img\s[^>]*onerror|alert\(|document\.cookie|"
    r"document\.write|\.innerHTML|eval\(|String\.fromCharCode)",
    re.IGNORECASE,
)

SENSITIVE_URL_KEYWORDS = re.compile(
    r"(password|passwd|secret|token|api[_-]?key|access[_-]?token|"
    r"private[_-]?key|credit[_-]?card|ssn|auth[_-]?token)",
    re.IGNORECASE,
)

IDOR_PATTERN = re.compile(
    r"/(?:user|account|profile|order|invoice|document|file|record)s?/(\d+)",
    re.IGNORECASE,
)

PARAM_TAMPER_PATTERNS = re.compile(
    r"(\.\./|%2e%2e|%00|%0a|%0d|\\x00|\\n|\\r|"
    r"admin=true|role=admin|is_admin=1|debug=1|test=1)",
    re.IGNORECASE,
)


class MLService:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(settings.MODEL_PATH):
            try:
                self.model = joblib.load(settings.MODEL_PATH)
                print(f"ML Model loaded from {settings.MODEL_PATH}")
            except Exception as e:
                print(f"Failed to load ML model: {e}")
                self.model = None
        else:
            print(f"ML Model not found at {settings.MODEL_PATH}. Prediction will rely on heuristics only.")

    def _extract_features(self, log: APILogRequest) -> pd.DataFrame:
        protocol = "HTTPS" if log.is_https else "HTTP"

        token_in_url = 1 if "token" in log.url.lower() or "key" in log.url.lower() else 0
        sensitive_keywords = 1 if any(k in log.url.lower() for k in ["admin", "password", "secret", "card"]) else 0
        cors_policy_open = 1 if log.headers.get("Access-Control-Allow-Origin") == "*" else 0
        failed_login_patterns = 1 if log.status_code == 401 and log.response_time_ms < 100 else 0

        return pd.DataFrame([{
            "request_method": log.method,
            "protocol": protocol,
            "auth_present": int(log.auth_token_present),
            "token_in_url": token_in_url,
            "sensitive_keywords_detected": sensitive_keywords,
            "cors_policy_open": cors_policy_open,
            "payload_entropy": log.request_body_entropy,
            "status_code": log.status_code,
            "request_frequency": 1,
            "failed_login_patterns": failed_login_patterns,
        }])

    # ─── Enriched Heuristic Analysis ─────────────────────────
    def _calculate_heuristic_risk(self, log: APILogRequest) -> tuple[float, list[str]]:
        """
        Returns (risk_score, list_of_reasons) with detailed explanations
        of what triggered each rule.
        """
        score = 0.0
        reasons = []

        # Rule 1: Token / API key in URL
        if "token" in log.url.lower() or "key" in log.url.lower():
            score += 0.4
            reasons.append("Authentication token or API key detected in URL (exposure risk)")

        # Rule 2: HTTP (not HTTPS)
        if not log.is_https:
            score += 0.3
            reasons.append("Insecure HTTP protocol — data transmitted without encryption")

        # Rule 3: Missing auth on sensitive endpoints
        if not log.auth_token_present and any(k in log.url.lower() for k in ["admin", "profile", "account", "settings"]):
            score += 0.3
            reasons.append("Missing authentication token on sensitive endpoint")

        # Rule 4: Sensitive keywords in URL
        if SENSITIVE_URL_KEYWORDS.search(log.url):
            score += 0.2
            reasons.append("Sensitive data keywords detected in URL parameters")

        # Rule 5: SQL injection patterns
        if SQL_PATTERNS.search(log.url):
            score += 0.4
            reasons.append("SQL injection keywords detected in request parameters")

        # Rule 6: XSS patterns
        if XSS_PATTERNS.search(log.url):
            score += 0.35
            reasons.append("Cross-Site Scripting (XSS) patterns detected in request")

        # Rule 7: IDOR pattern (sequential IDs)
        if IDOR_PATTERN.search(log.url):
            score += 0.15
            reasons.append("Sequential object ID in URL — potential IDOR vulnerability")

        # Rule 8: Parameter tampering patterns
        if PARAM_TAMPER_PATTERNS.search(log.url):
            score += 0.3
            reasons.append("Suspicious parameter tampering patterns detected")

        # Rule 9: CORS open policy
        if log.headers.get("Access-Control-Allow-Origin") == "*":
            score += 0.15
            reasons.append("Wildcard CORS policy — unrestricted cross-origin access")

        # Rule 10: 401/403 with fast response (brute force indicator)
        if log.status_code in (401, 403) and log.response_time_ms < 100:
            score += 0.2
            reasons.append("Rapid authentication failure — possible brute force attempt")

        # Rule 11: High entropy request body
        if log.request_body_entropy > 4.5:
            score += 0.15
            reasons.append("High entropy request body — potentially obfuscated or encoded payload")

        # Rule 12: Server error responses
        if 500 <= log.status_code < 600:
            score += 0.1
            reasons.append("Server error response — may indicate injection or misconfiguration")

        return min(score, 1.0), reasons

    # ─── Threat Classification ───────────────────────────────
    def _classify_threat(self, log: APILogRequest, risk_score: float, heuristic_reasons: list[str]) -> str:
        """
        Intelligently classify the threat type based on URL patterns,
        heuristic signals, and risk score.
        Returns one of the defined threat type strings.
        """
        url_lower = log.url.lower()

        # Priority-ordered classification
        if SQL_PATTERNS.search(log.url):
            return "SQL Injection"

        if XSS_PATTERNS.search(log.url):
            return "Cross-Site Scripting (XSS)"

        if log.status_code in (401, 403) and log.response_time_ms < 100:
            return "Broken Authentication"

        if SENSITIVE_URL_KEYWORDS.search(log.url):
            # Distinguish between token exposure and general data exposure
            if "token" in url_lower or "api_key" in url_lower or "access_token" in url_lower:
                return "Suspicious Token Exposure"
            return "Sensitive Data Exposure"

        if IDOR_PATTERN.search(log.url):
            return "Insecure Direct Object Reference (IDOR)"

        if not log.auth_token_present and any(k in url_lower for k in ["admin", "profile", "account", "settings", "dashboard"]):
            return "Missing Authentication"

        if PARAM_TAMPER_PATTERNS.search(log.url):
            return "Parameter Tampering"

        # Fallback: if risk is elevated but no specific pattern matched
        if risk_score >= 0.3:
            return "General Anomaly"

        return "General Anomaly"

    # ─── Threat Label ────────────────────────────────────────
    @staticmethod
    def _generate_threat_label(risk_score: float, threat_type: str) -> str:
        """
        Generate human-readable threat label:
          < 0.30 → Secured API
          0.30–0.60 → Potential Risk: {threat_type}
          > 0.60 → Critical Threat: {threat_type}
        """
        if risk_score < 0.30:
            return "Secured API"
        elif risk_score <= 0.60:
            return f"Potential Risk: {threat_type}"
        else:
            return f"Critical Threat: {threat_type}"

    # ─── OWASP Mapping ───────────────────────────────────────
    @staticmethod
    def _map_owasp(threat_type: str) -> str:
        """Map threat type to OWASP API Security Top 10 category."""
        return OWASP_MAP.get(threat_type, "API9: Improper Assets Management")

    # ─── Main Analysis ───────────────────────────────────────
    def analyze(self, log: APILogRequest) -> RiskAssessment:
        features_df = self._extract_features(log)

        ml_prob = 0.0
        ml_reasons = []

        if self.model:
            try:
                probs = self.model.predict_proba(features_df)[0]

                try:
                    classes = self.model.named_steps['classifier'].classes_
                except (KeyError, AttributeError):
                    classes = self.model.classes_

                class_map = {c: i for i, c in enumerate(classes)}

                prob_high = probs[class_map["High"]] if "High" in class_map else 0.0
                prob_medium = probs[class_map["Medium"]] if "Medium" in class_map else 0.0

                ml_prob = min((prob_high * 1.0) + (prob_medium * 0.5), 1.0)

                # ML-specific reasons
                if prob_high > 0.5:
                    ml_reasons.append(f"ML model predicts {prob_high * 100:.0f}% probability of high-risk threat")
                elif prob_medium > 0.4:
                    ml_reasons.append(f"ML model detects elevated risk pattern ({prob_medium * 100:.0f}% medium confidence)")

                if ml_prob > 0.6:
                    ml_reasons.append("Neural network confidence exceeds critical threshold")

            except Exception as e:
                print(f"Prediction error: {e}")

        # Heuristic analysis (now returns reasons too)
        heuristic_score, heuristic_reasons = self._calculate_heuristic_risk(log)

        # Hybrid Score
        final_score = (settings.ML_WEIGHT * ml_prob) + (settings.HEURISTIC_WEIGHT * heuristic_score)

        # Determine Level
        if final_score >= 0.7:
            risk_level = RiskLevel.HIGH
        elif final_score >= 0.3:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW

        # Combine reasons from both ML and heuristics
        all_reasons = ml_reasons + heuristic_reasons

        # If no specific reasons were found, add a generic one
        if not all_reasons:
            if final_score < 0.3:
                all_reasons.append("No security concerns detected — API request appears safe")
            else:
                all_reasons.append("Elevated risk detected through combined analysis")

        # Threat classification
        threat_type = self._classify_threat(log, final_score, heuristic_reasons)
        threat_label = self._generate_threat_label(final_score, threat_type)
        owasp_category = self._map_owasp(threat_type)

        return RiskAssessment(
            risk_score=round(final_score, 2),
            risk_level=risk_level,
            ml_probability=round(ml_prob, 2),
            heuristic_score=round(heuristic_score, 2),
            reasons=all_reasons,
            threat_type=threat_type,
            threat_label=threat_label,
            owasp_category=owasp_category,
        )

ml_service = MLService()
