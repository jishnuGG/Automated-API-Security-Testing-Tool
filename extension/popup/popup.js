// ============================================================
// POPUP.JS — UI Logic for Cyber Security Monitor Extension
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM REFERENCES ----
    const pulseDot = document.getElementById('pulse-dot');
    const statusLabel = document.getElementById('status-label');
    const threatCounter = document.getElementById('threat-counter');
    const logList = document.getElementById('log-list');
    const metricScanned = document.getElementById('metric-scanned');
    const metricBlocked = document.getElementById('metric-blocked');
    const metricScore = document.getElementById('metric-score');

    // ---- STATE ----
    let scannedCount = 0;
    let blockedCount = 0;
    let healthScore = 100;
    let threatCount = 0;
    let logsExist = false;

    // ---- LISTEN FOR MESSAGES FROM BACKGROUND ----
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "RISK_ASSESSMENT") {
            const data = message.payload;
            addLog(data);
            updateStatus(data.risk_level);
            updateMetrics(data);
        }
    });

    // ---- STATUS UPDATE ----
    function updateStatus(level) {
        if (level === "High" || level === "Medium") {
            pulseDot.className = 'pulse-dot risk';
            statusLabel.className = 'status-label risk';
            statusLabel.textContent = level === 'High' ? 'THREAT DETECTED' : 'ANOMALY FOUND';
            threatCount++;
            threatCounter.textContent = `THREATS: ${threatCount}`;

            // Trigger 3D scene threat flash
            if (typeof window.triggerThreatFlash === 'function') {
                window.triggerThreatFlash();
            }

            // Auto-reset to safe after 8 seconds if no new threats
            clearTimeout(window._statusResetTimer);
            window._statusResetTimer = setTimeout(() => {
                pulseDot.className = 'pulse-dot safe';
                statusLabel.className = 'status-label safe';
                statusLabel.textContent = 'SYSTEM SECURE';
            }, 8000);
        }
    }

    // ---- METRICS UPDATE ----
    function updateMetrics(data) {
        scannedCount++;
        animateCounter(metricScanned, scannedCount);

        if (data.risk_level === 'High') {
            blockedCount++;
            animateCounter(metricBlocked, blockedCount);
        }

        // Recalculate health score
        if (scannedCount > 0) {
            healthScore = Math.max(0, Math.round(100 - (blockedCount / scannedCount) * 100));
        }
        animateCounter(metricScore, healthScore);

        // Color the health score based on value
        if (healthScore > 75) {
            metricScore.style.color = '#00ffc8';
            metricScore.style.textShadow = '0 0 10px rgba(0, 255, 200, 0.3)';
        } else if (healthScore > 40) {
            metricScore.style.color = '#ffaa00';
            metricScore.style.textShadow = '0 0 10px rgba(255, 170, 0, 0.3)';
        } else {
            metricScore.style.color = '#ff3a5e';
            metricScore.style.textShadow = '0 0 10px rgba(255, 58, 94, 0.3)';
        }
    }

    // ---- ANIMATED COUNTER ----
    function animateCounter(element, targetValue) {
        const current = parseInt(element.textContent) || 0;
        const diff = targetValue - current;
        const steps = 12;
        let step = 0;

        function tick() {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            element.textContent = Math.round(current + diff * eased);

            if (step < steps) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    // ---- ADD LOG ENTRY ----
    function addLog(data) {
        // Remove empty state if first log
        if (!logsExist) {
            const emptyState = logList.querySelector('.log-empty');
            if (emptyState) {
                emptyState.remove();
            }
            logsExist = true;
        }

        const item = document.createElement('div');
        item.className = 'log-item';

        // Determine risk badge class
        let badgeClass = 'low';
        if (data.risk_level === 'High') badgeClass = 'high';
        else if (data.risk_level === 'Medium') badgeClass = 'medium';

        // Truncate URL for display
        const displayUrl = data.log_id
            ? 'Request Analyzed'
            : (data.url && data.url.length > 35 ? data.url.substring(0, 32) + '...' : (data.url || 'Unknown'));

        item.innerHTML = `
            <div class="log-risk-badge ${badgeClass}">${data.risk_level}</div>
            <div class="log-details">
                <div class="log-url">${displayUrl}</div>
                <div class="log-score">RISK SCORE: ${data.risk_score} • ${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        // Insert at top
        logList.insertBefore(item, logList.firstChild);

        // Limit to 50 visible log entries
        while (logList.children.length > 50) {
            logList.removeChild(logList.lastChild);
        }
    }

    // ---- TYPING ANIMATION FOR SUBTITLE ----
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) {
        const phrases = [
            'SECURITY MONITOR V2.0',
            'NEURAL THREAT ENGINE',
            'REAL-TIME ANALYSIS',
            'ML-POWERED DEFENSE'
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 80;

        function typeLoop() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                subtitleEl.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 40;
            } else {
                subtitleEl.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 80;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                typeSpeed = 2500; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 500; // Pause before next phrase
            }

            setTimeout(typeLoop, typeSpeed);
        }

        // Start after a short delay
        setTimeout(typeLoop, 1500);
    }
});
