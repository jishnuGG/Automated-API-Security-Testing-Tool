// background.js - API Security Monitor Extension
// Captures ALL network requests from any tab using webRequest API
// and forwards them to the backend for ML-based risk analysis.

const BACKEND_URL = "http://localhost:8000/api/v1/analyze";

// Track request start time
const requestTimestamps = new Map();

// Track headers captured before request is sent
const requestHeadersMap = new Map();

// ─────────────────────────────────────────────
// 1. Capture request start
// ─────────────────────────────────────────────
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.tabId === -1) return;

        requestTimestamps.set(details.requestId, Date.now());
    },
    { urls: ["<all_urls>"] }
);

// ─────────────────────────────────────────────
// 2. Capture request headers
// ─────────────────────────────────────────────
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.tabId === -1) return;

        const sensitiveKeys = ["authorization", "x-api-key", "cookie", "set-cookie"];
        const headersObj = {};

        if (details.requestHeaders) {
            details.requestHeaders.forEach(({ name }) => {
                const key = name.toLowerCase();
                headersObj[key] = sensitiveKeys.includes(key) ? "PRESENT" : "VALUE";
            });
        }

        requestHeadersMap.set(details.requestId, headersObj);
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

// ─────────────────────────────────────────────
// 3. Capture completed request
// ─────────────────────────────────────────────
chrome.webRequest.onCompleted.addListener(
    (details) => {

        if (details.tabId === -1) return;

        // Prevent logging our own backend call
        if (details.url.includes("localhost:8000")) return;

        const startTime = requestTimestamps.get(details.requestId) || Date.now();
        requestTimestamps.delete(details.requestId);

        const responseTimeMs = Date.now() - startTime;

        const headersObj = requestHeadersMap.get(details.requestId) || {};
        requestHeadersMap.delete(details.requestId);

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
    { urls: ["<all_urls>"] }
);

// ─────────────────────────────────────────────
// 4. Capture failed requests
// ─────────────────────────────────────────────
chrome.webRequest.onErrorOccurred.addListener(
    (details) => {

        if (details.tabId === -1) return;
        if (details.url.includes("localhost:8000")) return;

        const startTime = requestTimestamps.get(details.requestId) || Date.now();
        requestTimestamps.delete(details.requestId);

        requestHeadersMap.delete(details.requestId);

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

// ─────────────────────────────────────────────
// 5. Receive logs from content.js
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {

    if (message.type === "API_LOG") {
        processLog(message.payload);
    }

});

// ─────────────────────────────────────────────
// 6. Deduplication cache
// ─────────────────────────────────────────────
const recentRequests = new Map();
const DEDUP_WINDOW_MS = 500;

function isDuplicate(logData) {

    const key = `${logData.method}:${logData.url}`;
    const now = Date.now();

    const last = recentRequests.get(key);

    if (last && now - last < DEDUP_WINDOW_MS) return true;

    recentRequests.set(key, now);

    if (recentRequests.size > 200) {
        for (const [k, t] of recentRequests.entries()) {
            if (now - t > DEDUP_WINDOW_MS * 4) {
                recentRequests.delete(k);
            }
        }
    }

    return false;
}

// ─────────────────────────────────────────────
// 7. Send log to backend
// ─────────────────────────────────────────────
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
        origin: (() => {
            try {
                return new URL(logData.url).origin;
            } catch {
                return logData.url || "";
            }
        })()
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

        chrome.runtime.sendMessage({
            type: "RISK_ASSESSMENT",
            payload: assessment
        }).catch(() => { });

    } catch (error) {

        console.error("Failed to send log to backend:", error.message);

    }
}