import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const ActivityTimeline = ({ logs, darkMode }) => {
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return null;

        // Group logs by hour (last 24 hours)
        const now = new Date();
        const hourBuckets = {};

        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(hour.getHours() - i);
            const key = `${hour.getHours().toString().padStart(2, '0')}:00`;
            hourBuckets[key] = { total: 0, high: 0 };
        }

        logs.forEach(log => {
            if (!log.timestamp) return;
            const ts = new Date(log.timestamp);
            const key = `${ts.getHours().toString().padStart(2, '0')}:00`;
            if (hourBuckets[key]) {
                hourBuckets[key].total++;
                if (log.risk_level === 'High') hourBuckets[key].high++;
            }
        });

        const labels = Object.keys(hourBuckets);
        const totalData = labels.map(k => hourBuckets[k].total);
        const highData = labels.map(k => hourBuckets[k].high);

        return {
            labels,
            datasets: [
                {
                    label: 'Total Requests',
                    data: totalData,
                    backgroundColor: darkMode ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.4)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'High Risk',
                    data: highData,
                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };
    }, [logs, darkMode]);

    if (!chartData) {
        return (
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    📊 API Activity Timeline
                </h2>
                <div className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    No activity data available yet.
                </div>
            </div>
        );
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    color: darkMode ? '#6b7280' : '#9ca3af',
                    font: { family: 'JetBrains Mono, monospace', size: 9 },
                    maxRotation: 45,
                },
                grid: { display: false },
            },
            y: {
                ticks: {
                    color: darkMode ? '#6b7280' : '#9ca3af',
                    font: { family: 'JetBrains Mono, monospace', size: 10 },
                    stepSize: 1,
                },
                grid: {
                    color: darkMode ? '#1e1e1e' : '#f3f4f6',
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    font: { family: 'JetBrains Mono, monospace', size: 10 },
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
            },
        },
    };

    return (
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 API Activity Timeline (24h)
            </h2>
            <div style={{ height: 240 }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default ActivityTimeline;
