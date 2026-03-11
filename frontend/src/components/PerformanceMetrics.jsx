import React from 'react';

const MetricCard = ({ label, value, suffix, color, icon, darkMode }) => (
    <div className={`
        p-5 rounded-lg border flex flex-col gap-1 transition-all duration-200 relative overflow-hidden
        ${darkMode
            ? 'bg-[#111111] border-[#1e1e1e] hover:border-gray-700'
            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}
    `}>
        <div className={`absolute top-0 left-0 h-1 rounded-full ${color}`} style={{ width: '60%' }} />
        <span className={`text-xs font-semibold tracking-widest uppercase font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {icon} {label}
        </span>
        <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold font-mono ${color.replace('bg-', 'text-')}`}>
                {value}
            </span>
            {suffix && (
                <span className={`text-sm font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {suffix}
                </span>
            )}
        </div>
    </div>
);

const PerformanceMetrics = ({ metrics, darkMode }) => {
    if (!metrics) return null;

    const cards = [
        {
            label: 'Detection Accuracy',
            value: metrics.detection_accuracy || 0,
            suffix: '%',
            color: 'bg-green-400',
            icon: '◎',
        },
        {
            label: 'False Positive Rate',
            value: metrics.false_positive_rate || 0,
            suffix: '%',
            color: 'bg-amber-400',
            icon: '△',
        },
        {
            label: 'Avg Detection Time',
            value: metrics.avg_detection_time_ms || 0,
            suffix: 'ms',
            color: 'bg-cyan-400',
            icon: '⏱',
        },
        {
            label: 'Total APIs Analyzed',
            value: metrics.total_apis_analyzed || 0,
            suffix: '',
            color: 'bg-purple-400',
            icon: '∿',
        },
    ];

    return (
        <div className={`
            p-6 rounded-lg border
            ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
        `}>
            <h2 className={`text-xs font-semibold tracking-widest uppercase mb-5 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ⚡ Performance Metrics
            </h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map(card => (
                    <MetricCard key={card.label} {...card} darkMode={darkMode} />
                ))}
            </div>
        </div>
    );
};

export default PerformanceMetrics;
