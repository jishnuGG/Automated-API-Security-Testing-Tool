import React from 'react';
import RiskBadge from './RiskBadge';

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DetailsModal = ({ isOpen, onClose, log, darkMode }) => {
    if (!isOpen || !log) return null;

    const dm = darkMode;
    const threatType = log.threat_type || 'General Anomaly';
    const owaspCat = log.owasp_category || '';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-3xl rounded-xl border shadow-2xl flex flex-col max-h-[90vh] ${dm ? 'bg-[#0f0f0f] border-[#1e1e1e] shadow-cyan-500/5' : 'bg-white border-gray-200 shadow-lg'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${dm ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${dm ? 'text-white' : 'text-gray-900'}`}>
                        Threat Details
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${dm ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Method</span>
                            <span className={`inline-block text-sm font-mono font-medium px-2 py-1 rounded ${dm ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                {log.method || 'GET'}
                            </span>
                        </div>
                        <div>
                            <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Risk Level</span>
                            <RiskBadge level={log.risk_level} />
                        </div>
                    </div>

                    <div>
                        <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Full URL</span>
                        <div className={`p-3 rounded border font-mono text-sm break-all max-h-32 overflow-y-auto ${dm ? 'bg-[#111] border-[#1e1e1e] text-cyan-400' : 'bg-cyan-50 border-cyan-100 text-cyan-700'}`}>
                            {log.url}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Threat Type</span>
                            <span className={`inline-block text-sm font-mono font-medium px-2 py-1 rounded ${threatType.includes('SQL') || threatType.includes('Critical')
                                ? 'bg-red-500/10 text-red-400'
                                : threatType.includes('XSS') || threatType.includes('Token')
                                    ? 'bg-orange-500/10 text-orange-400'
                                    : threatType.includes('Authentication')
                                        ? 'bg-yellow-500/10 text-yellow-400'
                                        : dm ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {log.threat_label || threatType}
                            </span>
                        </div>
                        {owaspCat && (
                            <div>
                                <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>OWASP Category</span>
                                <span className={`inline-block text-sm font-mono font-bold px-2 py-1 rounded ${dm ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                    {owaspCat}
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dm ? 'text-cyan-500' : 'text-cyan-600'}`}>
                            Risk Score Explanation
                        </p>
                        <div className={`p-4 rounded-lg border ${dm ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-2xl font-bold font-mono ${log.risk_score >= 0.7 ? 'text-red-400'
                                    : log.risk_score >= 0.3 ? 'text-amber-400'
                                        : 'text-green-400'
                                    }`}>
                                    {log.risk_score !== undefined ? `${(log.risk_score * 100).toFixed(1)}%` : '—'}
                                </span>
                            </div>
                            {log.reasons && log.reasons.length > 0 ? (
                                <div className="space-y-2">
                                    {log.reasons.map((r, j) => (
                                        <div key={j} className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5">▸</span>
                                            <span className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{r}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={`text-sm ${dm ? 'text-gray-600' : 'text-gray-400'}`}>No specific reasons recorded.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Headers</span>
                            <div className={`p-3 rounded border font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto ${dm ? 'bg-[#111] border-[#1e1e1e] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                {Object.entries(log.headers || {}).map(([k, v]) => (
                                    <div key={k}><span className="text-cyan-500">{k}:</span> {v}</div>
                                ))}
                                {Object.keys(log.headers || {}).length === 0 && 'No headers recorded.'}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Response Status</span>
                                <div className={`p-3 rounded border font-mono text-sm inline-block ${dm ? 'bg-[#111] border-[#1e1e1e] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                    {log.status_code || 'Unknown'}
                                    {log.response_time_ms ? ` (${log.response_time_ms}ms)` : ''}
                                </div>
                            </div>

                            {/* Additional Score Breakdown */}
                            <div className={`p-3 rounded border ${dm ? 'bg-[#111] border-[#1e1e1e]' : 'bg-gray-50 border-gray-200'} grid grid-cols-2 gap-3`}>
                                <div>
                                    <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>ML Prob</span>
                                    <span className="text-xs font-mono text-cyan-400">{log.ml_probability !== undefined ? `${(log.ml_probability * 100).toFixed(1)}%` : '—'}</span>
                                </div>
                                <div>
                                    <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Heuristic</span>
                                    <span className="text-xs font-mono text-amber-400">{log.heuristic_score !== undefined ? `${(log.heuristic_score * 100).toFixed(1)}%` : '—'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>HTTPS</span>
                                    <span className={`text-xs font-mono ${log.is_https ? 'text-green-400' : 'text-red-400'}`}>
                                        {log.is_https ? 'Yes ✓' : 'No ✗'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
