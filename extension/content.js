// content.js - API Security Monitor Extension
// 1. Token Bridge: reads JWT from frontend localStorage and sends to background
// 2. API Interceptor: captures fetch/XHR calls and forwards to background

(function () {
    console.log("API Security Monitor: Active");

    // ─────────────────────────────────────────────
    // TOKEN BRIDGE — Read auth_token from localStorage
    // ─────────────────────────────────────────────

    const FRONTEND_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ];

    function isFrontendPage() {
        return FRONTEND_ORIGINS.some(origin => window.location.origin === origin);
    }

    function sendTokenToBg() {
        if (!isFrontendPage()) return;

        try {
            const token = localStorage.getItem("auth_token");
            const userRaw = localStorage.getItem("auth_user");

            if (token) {
                chrome.runtime.sendMessage({
                    type: "AUTH_TOKEN",
                    token: token,
                    user: userRaw ? JSON.parse(userRaw) : null,
                });
            } else {
                // User logged out — notify background
                chrome.runtime.sendMessage({ type: "AUTH_LOGOUT" });
            }
        } catch (e) {
            // Extension context may be invalidated
        }
    }

    // Send token immediately on page load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", sendTokenToBg);
    } else {
        sendTokenToBg();
    }

    // Listen for storage changes (login/logout from another tab or same tab)
    window.addEventListener("storage", (event) => {
        if (event.key === "auth_token" || event.key === "auth_user") {
            sendTokenToBg();
        }
    });

    // Listen for custom events dispatched by the frontend React app
    // This catches same-tab login/logout which the 'storage' event misses
    window.addEventListener("auth_token_changed", () => {
        sendTokenToBg();
    });

    // Poll periodically to catch token changes (fallback)
    let lastKnownToken = null;
    setInterval(() => {
        if (!isFrontendPage()) return;
        try {
            const currentToken = localStorage.getItem("auth_token");
            if (currentToken !== lastKnownToken) {
                lastKnownToken = currentToken;
                sendTokenToBg();
            }
        } catch (e) { }
    }, 3000);

    // ─────────────────────────────────────────────
    // API INTERCEPTOR — Capture fetch/XHR calls
    // ─────────────────────────────────────────────

    function sendLog(data) {
        try {
            chrome.runtime.sendMessage({
                type: "API_LOG",
                payload: data
            });
        } catch (e) {
            // Extension context invalidated
        }
    }

    const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'cookie'];

    // 1. Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const [resource, config] = args;
        const url = resource instanceof Request ? resource.url : resource;
        const method = (config && config.method) || (resource instanceof Request ? resource.method : "GET");

        const startTime = Date.now();

        try {
            const response = await originalFetch.apply(this, args);
            const endTime = Date.now();

            let headersList = {};
            if (config && config.headers) {
                if (config.headers instanceof Headers) {
                    config.headers.forEach((v, k) => headersList[k.toLowerCase()] = "PRESENT");
                } else {
                    Object.keys(config.headers).forEach(k => headersList[k.toLowerCase()] = "PRESENT");
                }
            }

            sendLog({
                url: url,
                method: method,
                headers: headersList,
                status_code: response.status,
                response_time_ms: endTime - startTime,
                timestamp: new Date().toISOString()
            });

            return response;
        } catch (error) {
            const endTime = Date.now();
            sendLog({
                url: url,
                method: method,
                headers: {},
                status_code: 0,
                response_time_ms: endTime - startTime,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    };

    // 2. Intercept XMLHttpRequest
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;

    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        this._headers = {};
        this._startTime = Date.now();
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function (header, value) {
        this._headers[header.toLowerCase()] = "PRESENT";
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            const endTime = Date.now();
            sendLog({
                url: this._url,
                method: this._method,
                headers: this._headers,
                status_code: this.status,
                response_time_ms: endTime - this._startTime,
                timestamp: new Date().toISOString()
            });
        });

        this.addEventListener('error', function () {
            const endTime = Date.now();
            sendLog({
                url: this._url,
                method: this._method,
                headers: this._headers,
                status_code: 0,
                response_time_ms: endTime - this._startTime,
                timestamp: new Date().toISOString()
            });
        });

        return send.apply(this, arguments);
    };

})();
