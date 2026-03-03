import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const RiskChart = ({ stats, darkMode }) => {
    const total = (stats.high || 0) + (stats.medium || 0) + (stats.low || 0);

    const data = {
        labels: ['High Risk', 'Medium Risk', 'Low Risk'],
        datasets: [
            {
                data: [stats.high || 0, stats.medium || 0, stats.low || 0],
                backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(245,158,11,0.85)', 'rgba(0,210,255,0.85)'],
                borderColor: ['rgba(239,68,68,1)', 'rgba(245,158,11,1)', 'rgba(0,210,255,1)'],
                borderWidth: 2,
                hoverOffset: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)`,
                },
                backgroundColor: darkMode ? '#1a1a1a' : '#fff',
                titleColor: darkMode ? '#e5e7eb' : '#111',
                bodyColor: darkMode ? '#9ca3af' : '#374151',
                borderColor: darkMode ? '#2d2d2d' : '#e5e7eb',
                borderWidth: 1,
            },
        },
    };

    const legendItems = [
        { label: 'High Risk', count: stats.high || 0, color: '#ef4444' },
        { label: 'Medium Risk', count: stats.medium || 0, color: '#f59e0b' },
        { label: 'Low Risk', count: stats.low || 0, color: '#00d2ff' },
    ];

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative" style={{ width: 220, height: 220 }}>
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-3xl font-bold font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                    <span className={`text-xs tracking-widest uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total</span>
                </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
                {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                        </div>
                        <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiskChart;
