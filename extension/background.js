// background.js

const BACKEND_URL = "http://localhost:8000/api/v1/analyze";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "API_LOG") {
        processLog(message.payload);
    }
});

async function processLog(logData) {
    // 1. Sanitize Data (Double check)
    // We already masked headers in content.js, but let's ensure structure matches API

    // Check for auth presence
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
        request_body_entropy: 0.0, // Not calculating entropy in extension for performance
        auth_token_present: auth_present,
        is_https: logData.url?.startsWith("https") ?? false,
        origin: (() => { try { return new URL(logData.url).origin; } catch { return logData.url || ""; } })()
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const assessment = await response.json();

        if (assessment.risk_level === "High") {
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

            // Optional: Notify user
            /*
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon48.png",
                title: "High Risk API Detected",
                message: `Risk Score: ${assessment.risk_score}. ${assessment.reasons.join(", ")}`
            });
            */
        }

        // Broadcast to popup/dashboard if open
        chrome.runtime.sendMessage({
            type: "RISK_ASSESSMENT",
            payload: assessment
        });

    } catch (error) {
        console.error("Failed to send log to backend:", error);
    }
}