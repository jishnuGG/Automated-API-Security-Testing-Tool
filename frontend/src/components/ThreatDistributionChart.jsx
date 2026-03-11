import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const THREAT_COLORS = {
    'SQL Injection': '#ef4444',
    'Cross-Site Scripting (XSS)': '#f97316',
    'Broken Authentication': '#eab308',
    'Sensitive Data Exposure': '#a855f7',
    'Insecure Direct Object Reference (IDOR)': '#3b82f6',
    'Suspicious Token Exposure': '#ec4899',
    'Missing Authentication': '#14b8a6',
    'Parameter Tampering': '#f43f5e',
    'General Anomaly': '#6b7280',
};

const DEFAULT_COLORS = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
    '#ec4899', '#3b82f6', '#f97316', '#6366f1', '#14b8a6',
];

const ThreatDistributionChart = ({ metrics, darkMode }) => {
    if (!metrics || !metrics.threat_distribution) return null;

    const distribution = metrics.threat_distribution;
    const labels = Object.keys(distribution);
    const values = Object.values(distribution);

    if (labels.length === 0) {
        return (
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    🎯 Threat Distribution
                </h2>
                <div className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    No threat data available yet.
                </div>
            </div>
        );
    }

    const colors = labels.map((l, i) => THREAT_COLORS[l] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);

    const data = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: colors.map(c => c + '33'),
            borderColor: colors,
            borderWidth: 2,
            hoverBackgroundColor: colors.map(c => c + '66'),
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { family: 'JetBrains Mono, monospace', size: 10 },
                    padding: 12,
                    usePointStyle: true,
                    pointStyleWidth: 12,
                },
            },
            tooltip: {
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                titleColor: darkMode ? '#f3f4f6' : '#111827',
                bodyColor: darkMode ? '#d1d5db' : '#4b5563',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                titleFont: { family: 'JetBrains Mono, monospace', weight: 'bold' },
                bodyFont: { family: 'JetBrains Mono, monospace' },
                callbacks: {
                    label: (ctx) => {
                        const total = values.reduce((a, b) => a + b, 0);
                        const pct = ((ctx.raw / total) * 100).toFixed(1);
                        return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                    },
                },
            },
        },
    };

    return (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                🎯 Threat Distribution
            </h2>
            <div style={{ height: 260 }}>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
};

export default ThreatDistributionChart;
