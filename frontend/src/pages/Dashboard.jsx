import React from 'react';
import RiskChart from '../components/RiskChart';
import RiskBadge from '../components/RiskBadge';

const StatCard = ({ label, value, sub, color, icon, darkMode }) => (
    <div className={`
    p-5 rounded-lg border flex flex-col gap-1 transition-all duration-200
    ${darkMode
            ? 'bg-[#111111] border-[#1e1e1e] hover:border-gray-700'
            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}
  `}>
        <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold tracking-widest uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {icon} {label}
            </span>
        </div>
        <div className={`text-4xl font-bold font-mono ${color}`}>{value}</div>
        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</div>
    </div>
);

const Dashboard = ({ logs, stats, darkMode }) => {
    const total = (stats.high || 0) + (stats.medium || 0) + (stats.low || 0);
    const recentThreats = [...logs].slice(0, 8);

    const statCards = [
        { label: 'Total Threats', value: total, sub: 'Detected', color: 'text-cyan-400', icon: '◎' },
        { label: 'High Risk', value: stats.high || 0, sub: 'High Priority', color: 'text-red-400', icon: '△' },
        { label: 'Medium Risk', value: stats.medium || 0, sub: 'Requires Attention', color: 'text-amber-400', icon: '◎' },
        { label: 'Low / Safe', value: stats.low || 0, sub: 'Monitored', color: 'text-green-400', icon: '∿' },
    ];

    return (
        <div className="p-8 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} darkMode={darkMode} />
                ))}
            </div>

            {/* Bottom two panels */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {/* Attack Distribution Chart */}
                <div className={`
          xl:col-span-2 p-6 rounded-lg border
          ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
        `}>
                    <h2 className={`text-xs font-semibold tracking-widest uppercase mb-6 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Attack Distribution
                    </h2>
                    <RiskChart stats={stats} darkMode={darkMode} />
                </div>

                {/* Recent Threats */}
                <div className={`
          xl:col-span-3 p-6 rounded-lg border flex flex-col
          ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
        `}>
                    <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Recent Threats
                    </h2>
                    <div className="flex flex-col gap-0 overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
                        {recentThreats.length === 0 ? (
                            <div className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                No threats detected yet. Loading...
                            </div>
                        ) : (
                            recentThreats.map((log, i) => {
                                const url = log.url || '';
                                const shortUrl = url.length > 45 ? url.substring(0, 45) + '…' : url;
                                const time = log.timestamp
                                    ? new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                    : '—';
                                return (
                                    <div key={i} className={`
                    flex items-center justify-between py-3 border-b group
                    ${darkMode ? 'border-[#1a1a1a] hover:bg-[#161616]' : 'border-gray-100 hover:bg-gray-50'}
                  `}>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                {log.method || 'GET'}
                                            </span>
                                            <RiskBadge level={log.risk_level} />
                                            <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} title={url}>
                                                {shortUrl}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-mono ml-3 shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {time}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
