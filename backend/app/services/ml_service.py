import joblib
import pandas as pd
import numpy as np
import os
from app.config import get_settings
from app.models.logs import APILogRequest, RiskAssessment, RiskLevel

settings = get_settings()

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
        # manual feature extraction matching training data
        protocol = "HTTPS" if log.is_https else "HTTP"
        
        # Heuristics for binary features if not provided
        # In a real scenario, these would be more complex
        token_in_url = 1 if "token" in log.url.lower() or "key" in log.url.lower() else 0
        sensitive_keywords = 1 if any(k in log.url.lower() for k in ["admin", "password", "secret", "card"]) else 0
        cors_policy_open = 1 if log.headers.get("Access-Control-Allow-Origin") == "*" else 0
        failed_login_patterns = 1 if log.status_code == 401 and log.response_time_ms < 100 else 0
        
        # Create a single-row DataFrame
        return pd.DataFrame([{
            "request_method": log.method,
            "protocol": protocol,
            "auth_present": int(log.auth_token_present),
            "token_in_url": token_in_url,
            "sensitive_keywords_detected": sensitive_keywords,
            "cors_policy_open": cors_policy_open,
            "payload_entropy": log.request_body_entropy,
            "status_code": log.status_code,
            "request_frequency": 1, # Default to 1 for single request analysis
            "failed_login_patterns": failed_login_patterns
        }])

    def _calculate_heuristic_risk(self, log: APILogRequest) -> float:
        score = 0.0
        
        # Rule 1: Token in URL is bad
        if "token" in log.url.lower() or "key" in log.url.lower():
            score += 0.4
            
        # Rule 2: HTTP is risky
        if not log.is_https:
            score += 0.3
            
        # Rule 3: Missing Auth on sensitive endpoints
        if not log.auth_token_present and any(k in log.url.lower() for k in ["admin", "profile"]):
            score += 0.3
            
        return min(score, 1.0)

    def analyze(self, log: APILogRequest) -> RiskAssessment:
        features_df = self._extract_features(log)
        
        ml_prob = 0.0
        ml_reasons = []
        
        if self.model:
            try:
                probs = self.model.predict_proba(features_df)[0]
                
                # Safely get class labels — try named_steps first, fallback to classes_
                try:
                    classes = self.model.named_steps['classifier'].classes_
                except (KeyError, AttributeError):
                    classes = self.model.classes_
                
                # Map class labels to probability indices
                class_map = {c: i for i, c in enumerate(classes)}
                
                # Weighted risk score (High=1.0, Medium=0.5)
                prob_high   = probs[class_map["High"]]   if "High"   in class_map else 0.0
                prob_medium = probs[class_map["Medium"]] if "Medium" in class_map else 0.0
                
                # Clamp to [0, 1] — weighted sum can exceed 1.0 when both are non-zero
                ml_prob = min((prob_high * 1.0) + (prob_medium * 0.5), 1.0)
                
            except Exception as e:
                print(f"Prediction error: {e}")
                
        heuristic_score = self._calculate_heuristic_risk(log)
        
        # Hybrid Score
        final_score = (settings.ML_WEIGHT * ml_prob) + (settings.HEURISTIC_WEIGHT * heuristic_score)
        
        # Determine Level
        if final_score >= 0.7:
            risk_level = RiskLevel.HIGH
        elif final_score >= 0.3:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW
            
        # Explanations
        reasons = []
        if heuristic_score > 0.3:
            reasons.append("Heuristic checks flagged potential issues.")
        if ml_prob > 0.6:
            reasons.append("ML Model predicts high probability of risk.")
        if "token" in log.url.lower():
            reasons.append("Token detected in URL.")
        if not log.is_https:
            reasons.append("Insecure HTTP protocol usage.")
            
        return RiskAssessment(
            risk_score=round(final_score, 2),
            risk_level=risk_level,
            ml_probability=round(ml_prob, 2),
            heuristic_score=round(heuristic_score, 2),
            reasons=reasons
        )

ml_service = MLService()
