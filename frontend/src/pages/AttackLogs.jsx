import React from 'react';
import RiskBadge from '../components/RiskBadge';

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const exportCSV = (logs) => {
    const headers = ['ID', 'Timestamp', 'Method', 'URL', 'Status Code', 'ML Probability', 'Heuristic Score', 'Risk Score', 'Risk Level', 'Is HTTPS', 'Reasons'];
    const rows = logs.map((log) => [
        (log._id || '').toString().substring(0, 8),
        log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '',
        log.method || '',
        `"${(log.url || '').replace(/"/g, '""')}"`,
        log.status_code || '',
        log.ml_probability !== undefined ? (log.ml_probability * 100).toFixed(1) + '%' : '',
        log.heuristic_score !== undefined ? (log.heuristic_score * 100).toFixed(1) + '%' : '',
        log.risk_score !== undefined ? (log.risk_score * 100).toFixed(1) + '%' : '',
        log.risk_level || '',
        log.is_https ? 'Yes' : 'No',
        `"${(log.reasons || []).join('; ')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_security_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

const AttackLogs = ({ logs, darkMode, onRefresh }) => {
    return (
        <div className="p-8 space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Title handled by Header component, show a sub-count here */}
                    <p className={`text-xs font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        {logs.length} records in database
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onRefresh}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
              ${darkMode ? 'bg-[#111111] border-[#1e1e1e] text-gray-400 hover:border-gray-700 hover:text-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        <RefreshIcon /> REFRESH
                    </button>
                    <button
                        onClick={() => exportCSV(logs)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 transition-all"
                    >
                        <DownloadIcon /> EXPORT CSV
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
                                <th>Timestamp</th>
                                <th>Method</th>
                                <th>URL</th>
                                <th>ML Prob</th>
                                <th>Risk Score</th>
                                <th>Risk Level</th>
                                <th>Anomaly</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`text-center py-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        No logs yet. Install the Chrome extension and browse some sites to capture API traffic.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, i) => {
                                    const id = (log._id || '').toString().substring(0, 8);
                                    const url = log.url || '';
                                    const shortUrl = url.length > 40 ? url.substring(0, 40) + '…' : url;
                                    const time = log.timestamp
                                        ? new Date(log.timestamp).toLocaleString('en-IN')
                                        : '—';
                                    const isAnomaly = (log.risk_level || '').toLowerCase() !== 'low';

                                    return (
                                        <tr key={i}>
                                            <td className="font-mono text-xs text-gray-500">{id || `log-${i}`}</td>
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
                                            <td className="text-center">
                                                {isAnomaly
                                                    ? <span className="text-green-400 text-base">✓</span>
                                                    : <span className="text-gray-700">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={`px-4 py-3 border-t text-xs flex items-center justify-between ${darkMode ? 'border-[#1e1e1e] text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                    <span>Total: {logs.length} records</span>
                    <span>Auto-refreshes every 5 seconds</span>
                </div>
            </div>
        </div>
    );
};

export default AttackLogs;
