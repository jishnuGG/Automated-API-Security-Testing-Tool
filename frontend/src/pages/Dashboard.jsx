import React from 'react';
import RiskChart from '../components/RiskChart';
import RiskBadge from '../components/RiskBadge';
import PerformanceMetrics from '../components/PerformanceMetrics';
import ThreatDistributionChart from '../components/ThreatDistributionChart';
import ActivityTimeline from '../components/ActivityTimeline';

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

const Dashboard = ({ logs, stats, websites = [], darkMode, metrics }) => {
    const total = stats.total_requests || ((stats.high || 0) + (stats.medium || 0) + (stats.low || 0));
    const recentThreats = [...logs].slice(0, 8);

    const statCards = [
        { label: 'Total Requests', value: total, sub: `${stats.total_websites || 0} websites tracked`, color: 'text-cyan-400', icon: '◎' },
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

            {/* Performance Metrics */}
            <PerformanceMetrics metrics={metrics} darkMode={darkMode} />

            {/* Charts Row: Attack Distribution + Threat Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className={`
                    p-6 rounded-lg border
                    ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
                `}>
                    <h2 className={`text-xs font-semibold tracking-widest uppercase mb-6 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Attack Distribution
                    </h2>
                    <RiskChart stats={stats} darkMode={darkMode} />
                </div>

                <ThreatDistributionChart metrics={metrics} darkMode={darkMode} />
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline logs={logs} darkMode={darkMode} />

            {/* Middle row: Top Websites */}
            <div className={`
                p-6 rounded-lg border flex flex-col
                ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
            `}>
                <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    🌐 Top Websites by Activity
                </h2>
                <div className="flex flex-col gap-0 overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
                    {websites.length === 0 ? (
                        <div className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            No website activity recorded yet.
                        </div>
                    ) : (
                        websites.slice(0, 10).map((site, i) => {
                            const lastSeen = site.last_seen
                                ? new Date(site.last_seen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : '—';
                            const hasHighRisk = (site.high_risk_count || 0) > 0;
                            return (
                                <div key={i} className={`
                                    flex items-center justify-between py-3 border-b group
                                    ${darkMode ? 'border-[#1a1a1a] hover:bg-[#161616]' : 'border-gray-100 hover:bg-gray-50'}
                                `}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className={`text-xs font-mono font-semibold px-2 py-1 rounded min-w-[2rem] text-center
                                            ${hasHighRisk
                                                ? 'bg-red-500/10 text-red-400'
                                                : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                            {site.total_requests || 0}
                                        </span>
                                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {site.domain}
                                        </span>
                                        {hasHighRisk && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                                                {site.high_risk_count} HIGH
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {site.endpoint_count || 0} endpoints
                                        </span>
                                        <span className={`text-xs font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {lastSeen}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Recent High-Risk Threats */}
            <div className={`
                p-6 rounded-lg border flex flex-col
                ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}
            `}>
                <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ⚠ Recent High-Risk Threats
                </h2>
                <div className="flex flex-col gap-0 overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
                    {recentThreats.length === 0 ? (
                        <div className={`text-sm text-center py-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            No high-risk threats detected yet. Loading...
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
                                        {log.threat_type && log.threat_type !== 'General Anomaly' && (
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                                                {log.threat_type}
                                            </span>
                                        )}
                                        {log.domain && (
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                                {log.domain}
                                            </span>
                                        )}
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
    );
};

export default Dashboard;
