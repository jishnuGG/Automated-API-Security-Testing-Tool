// background.js - API Security Monitor Extension
// Captures ALL network requests from any tab using webRequest API
// and forwards them to the backend for ML-based risk analysis.

const BACKEND_URL = "http://localhost:8000/api/v1/analyze";

// ──────────────────────────────────────────────────────────────────────────────
// 1. webRequest listener — captures ALL browser-level requests (any tab, any site)
//    This is more reliable than content.js fetch/XHR intercept which only catches
//    JS-initiated calls. webRequest catches EVERYTHING the browser sends.
// ──────────────────────────────────────────────────────────────────────────────

// Map to track request start times
const requestTimestamps = new Map();

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.tabId === -1) return; // Ignore background/extension own requests
        requestTimestamps.set(details.requestId, Date.now());
    },
    { urls: ["<all_urls>"] }
);

chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.tabId === -1) return; // Ignore background/extension own requests

        // Skip our own calls to the backend to avoid infinite loop
        if (details.url.includes("localhost:8000")) return;

        const startTime = requestTimestamps.get(details.requestId) || Date.now();
        requestTimestamps.delete(details.requestId);

        const responseTimeMs = Date.now() - startTime;

        // Build sanitized headers object (mark presence, strip values)
        const sensitiveKeys = ["authorization", "x-api-key", "cookie", "set-cookie"];
        const headersObj = {};
        if (details.requestHeaders) {
            details.requestHeaders.forEach(({ name, value }) => {
                const key = name.toLowerCase();
                headersObj[key] = sensitiveKeys.includes(key) ? "PRESENT" : value;
            });
        }

        const logData = {
            url: details.url,
            method: details.method || "GET",
            headers: headersObj,
            status_code: details.statusCode,
            response_time_ms: responseTimeMs,
            timestamp: new Date().toISOString(),
        };

        processLog(logData);
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        if (details.tabId === -1) return;
        if (details.url.includes("localhost:8000")) return;

        const startTime = requestTimestamps.get(details.requestId) || Date.now();
        requestTimestamps.delete(details.requestId);

        processLog({
            url: details.url,
            method: details.method || "GET",
            headers: {},
            status_code: 0,
            response_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        });
    },
    { urls: ["<all_urls>"] }
);

// ──────────────────────────────────────────────────────────────────────────────
// 2. Message listener from content.js (JS-initiated fetch/XHR intercept)
//    This is a secondary capture layer — webRequest above is the primary.
// ──────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "API_LOG") {
        // Only process if webRequest didn't already get this (avoid duplicates)
        // For simplicity we deduplicate via a short TTL cache in processLog
        processLog(message.payload);
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Deduplication cache (URL+method+timestamp window)
// ──────────────────────────────────────────────────────────────────────────────
const recentRequests = new Map();
const DEDUP_WINDOW_MS = 500;

function isDuplicate(logData) {
    const key = `${logData.method}:${logData.url}`;
    const now = Date.now();
    const last = recentRequests.get(key);
    if (last && now - last < DEDUP_WINDOW_MS) return true;
    recentRequests.set(key, now);
    // Clean old entries periodically
    if (recentRequests.size > 200) {
        for (const [k, t] of recentRequests.entries()) {
            if (now - t > DEDUP_WINDOW_MS * 4) recentRequests.delete(k);
        }
    }
    return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Core processing — send log to backend
// ──────────────────────────────────────────────────────────────────────────────
async function processLog(logData) {
    if (isDuplicate(logData)) return;

    const auth_present =
        logData.headers?.authorization === "PRESENT" ||
        logData.headers?.["x-api-key"] === "PRESENT" ||
        logData.headers?.cookie === "PRESENT";

    const payload = {
        url: logData.url,
        method: logData.method,
        headers: logData.headers,
        status_code: logData.status_code,
        timestamp: logData.timestamp,
        response_time_ms: logData.response_time_ms,
        request_body_entropy: 0.0,
        auth_token_present: auth_present,
        is_https: logData.url?.startsWith("https") ?? false,
        origin: (() => { try { return new URL(logData.url).origin; } catch { return logData.url || ""; } })()
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const assessment = await response.json();

        if (assessment.risk_level === "High") {
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
        }

        // Broadcast to popup/dashboard if open
        chrome.runtime.sendMessage({
            type: "RISK_ASSESSMENT",
            payload: assessment
        }).catch(() => { }); // Ignore if popup not open
    } catch (error) {
        console.error("Failed to send log to backend:", error.message);
    }
}