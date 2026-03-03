// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const logList = document.getElementById('log-list');

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "RISK_ASSESSMENT") {
            const data = message.payload;
            addLog(data);
            updateStatus(data.risk_level);
        }
    });

    function updateStatus(level) {
        if (level === "High" || level === "Medium") {
            statusDiv.className = "status risk";
            statusDiv.textContent = `High Level Risk Detected!`;
        } else {
            // Reset after timeout or keep? For now keep last state or default safe
            // actually usually we want to show the worst status of the current page
        }
    }

    function addLog(data) {
        const item = document.createElement('div');
        item.className = 'log-item';
        const color = data.risk_level === 'High' ? 'red' : (data.risk_level === 'Medium' ? 'orange' : 'green');

        // Truncate URL
        const url = data.log_id ? "Request Analyzed" : (data.url.length > 30 ? data.url.substring(0, 27) + "..." : data.url);

        item.innerHTML = `
            <strong style="color:${color}">[${data.risk_level}]</strong> 
            ${url}<br>
            <small>Score: ${data.risk_score}</small>
        `;
        logList.insertBefore(item, logList.firstChild);
    }
});
