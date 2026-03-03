// content.js - Intercept API calls
(function () {
    console.log("API Security Monitor: Active");

    // Helper to send log to background
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

    // specific headers to check for presence
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

            // Extract headers if possible (Fetch API headers are tricky to iterate sometimes depending on mode)
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
            // Log failed requests too
            const endTime = Date.now();
            sendLog({
                url: url,
                method: method,
                headers: {},
                status_code: 0, // Network error
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
