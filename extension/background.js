// background.js - API Security Monitor Extension
// Captures ALL network requests from any tab using webRequest API
// and forwards them to the backend for ML-based risk analysis.
// Now includes JWT authentication via the Token Bridge.

const BACKEND_URL = "http://localhost:8000/api/v1/analyze";

// Track request start time
const requestTimestamps = new Map();

// Track headers captured before request is sent
const requestHeadersMap = new Map();

// ─────────────────────────────────────────────
// AUTH: Token management via Token Bridge
// ─────────────────────────────────────────────
let cachedAuthToken = null;
let cachedAuthUser = null;

// Load token from chrome.storage on startup
chrome.storage.local.get(["auth_token", "auth_user"], (result) => {
    if (result.auth_token) {
        cachedAuthToken = result.auth_token;
        cachedAuthUser = result.auth_user || null;
        console.log("[Auth] Token loaded from storage");
    }
});

/**
 * Get the current auth token.
 * Returns null if user is not authenticated.
 */
function getAuthToken() {
    return cachedAuthToken;
}

/**
 * Get the current authenticated user info.
 */
function getAuthUser() {
    return cachedAuthUser;
}

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
// 5. Receive messages from content.js and popup
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Token Bridge: receive auth token from content script
    if (message.type === "AUTH_TOKEN") {
        cachedAuthToken = message.token;
        cachedAuthUser = message.user || null;

        // Persist to chrome.storage for service worker restarts
        chrome.storage.local.set({
            auth_token: message.token,
            auth_user: message.user || null,
        });

        console.log("[Auth] Token received from content script");

        // Update extension badge to show authenticated
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#00CC66" });

        return;
    }

    // Token Bridge: user logged out
    if (message.type === "AUTH_LOGOUT") {
        cachedAuthToken = null;
        cachedAuthUser = null;

        chrome.storage.local.remove(["auth_token", "auth_user"]);

        console.log("[Auth] User logged out, token cleared");

        // Update badge to show unauthenticated
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF6600" });

        return;
    }

    // API log from content.js
    if (message.type === "API_LOG") {
        processLog(message.payload);
        return;
    }

    // Popup requesting auth status
    if (message.type === "GET_AUTH_STATUS") {
        sendResponse({
            authenticated: !!cachedAuthToken,
            user: cachedAuthUser,
        });
        return true; // keep message channel open for async response
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
// 7. Send log to backend (with JWT auth)
// ─────────────────────────────────────────────
async function processLog(logData) {

    if (isDuplicate(logData)) return;

    // Check authentication — skip sending if not logged in
    const token = getAuthToken();
    if (!token) {
        // Silently skip — user is not authenticated
        return;
    }

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
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
        });

        // Handle expired/invalid token
        if (response.status === 401) {
            console.warn("[Auth] Token expired or invalid, clearing auth");
            cachedAuthToken = null;
            cachedAuthUser = null;
            chrome.storage.local.remove(["auth_token", "auth_user"]);
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#FF6600" });
            return;
        }

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const assessment = await response.json();

        if (assessment.risk_level === "High") {
            chrome.action.setBadgeText({ text: "⚠" });
            chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

            // Reset to auth badge after 5 seconds
            setTimeout(() => {
                if (cachedAuthToken) {
                    chrome.action.setBadgeText({ text: "✓" });
                    chrome.action.setBadgeBackgroundColor({ color: "#00CC66" });
                }
            }, 5000);
        }

        chrome.runtime.sendMessage({
            type: "RISK_ASSESSMENT",
            payload: assessment
        }).catch(() => { });

    } catch (error) {

        console.error("Failed to send log to backend:", error.message);

    }
}