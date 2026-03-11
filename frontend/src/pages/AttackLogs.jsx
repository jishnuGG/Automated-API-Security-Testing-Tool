import React, { useState } from 'react';
import RiskBadge from '../components/RiskBadge';
import ExportModal from '../components/ExportModal';
import { exportLogs } from '../services/api';

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const ExportIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const AttackLogs = ({ logs, darkMode, onRefresh }) => {
    const [domainFilter, setDomainFilter] = useState('all');
    const [showExportModal, setShowExportModal] = useState(false);

    // Get unique domains from logs
    const domains = [...new Set(logs.map(l => l.domain).filter(Boolean))].sort();

    const filtered = domainFilter === 'all'
        ? logs
        : logs.filter(l => l.domain === domainFilter);

    const handleExport = async (startDate, endDate, format) => {
        await exportLogs(startDate, endDate, format);
    };

    return (
        <div className="p-8 space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-xs font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        {filtered.length} high-risk records {domainFilter !== 'all' ? `from ${domainFilter}` : 'total'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Domain filter */}
                    <select
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all outline-none
                            ${darkMode
                                ? 'bg-[#111111] border-[#1e1e1e] text-gray-400'
                                : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        <option value="all">All Domains</option>
                        {domains.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <button
                        onClick={onRefresh}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
              ${darkMode ? 'bg-[#111111] border-[#1e1e1e] text-gray-400 hover:border-gray-700 hover:text-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        <RefreshIcon /> REFRESH
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 text-sm font-semibold font-mono hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all"
                        id="export-logs-btn"
                    >
                        <ExportIcon /> EXPORT LOGS
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full cyber-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Domain</th>
                                <th>Timestamp</th>
                                <th>Method</th>
                                <th>URL</th>
                                <th>ML Prob</th>
                                <th>Risk Score</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`text-center py-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        No high-risk logs recorded yet. Only high-risk API calls are stored here for investigation.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((log, i) => {
                                    const id = (log._id || '').toString().substring(0, 8);
                                    const url = log.url || '';
                                    const shortUrl = url.length > 40 ? url.substring(0, 40) + '…' : url;
                                    const time = log.timestamp
                                        ? new Date(log.timestamp).toLocaleString('en-IN')
                                        : '—';

                                    return (
                                        <tr key={i}>
                                            <td className="font-mono text-xs text-gray-500">{id || `log-${i}`}</td>
                                            <td>
                                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                                    {log.domain || '—'}
                                                </span>
                                            </td>
                                            <td className="font-mono text-xs">{time}</td>
                                            <td>
                                                <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                    {log.method || 'GET'}
                                                </span>
                                            </td>
                                            <td className="font-mono text-xs max-w-xs" title={url}>{shortUrl}</td>
                                            <td className="font-mono text-sm">
                                                {log.ml_probability !== undefined
                                                    ? <span className="text-cyan-400">{(log.ml_probability * 100).toFixed(1)}%</span>
                                                    : <span className="text-gray-600">—</span>}
                                            </td>
                                            <td className="font-mono text-sm font-semibold">
                                                {log.risk_score !== undefined
                                                    ? `${(log.risk_score * 100).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                            <td><RiskBadge level={log.risk_level} /></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={`px-4 py-3 border-t text-xs flex items-center justify-between ${darkMode ? 'border-[#1e1e1e] text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                    <span>Showing: {filtered.length} high-risk records</span>
                    <span>Auto-refreshes every 5 seconds</span>
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                darkMode={darkMode}
                onExport={handleExport}
            />
        </div>
    );
};

export default AttackLogs;
