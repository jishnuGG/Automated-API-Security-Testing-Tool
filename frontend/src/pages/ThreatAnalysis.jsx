import React, { useState } from 'react';
import RiskBadge from '../components/RiskBadge';

const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const FilterIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

const ThreatAnalysis = ({ logs, darkMode }) => {
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = logs.filter((log) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            (log.url || '').toLowerCase().includes(q) ||
            (log.method || '').toLowerCase().includes(q) ||
            (log.risk_level || '').toLowerCase().includes(q);
        const matchRisk =
            riskFilter === 'all' ||
            (log.risk_level || '').toLowerCase() === riskFilter;
        return matchSearch && matchRisk;
    });

    const inputBase = `w-full text-sm rounded-lg px-4 py-2.5 border outline-none transition-all
    ${darkMode
            ? 'bg-[#111111] border-[#1e1e1e] text-gray-300 placeholder-gray-600 focus:border-cyan-500/50'
            : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-cyan-400'}`;

    return (
        <div className="p-8 space-y-5">
            {/* Search + Filter Row */}
            <div className="flex gap-3 items-center">
                <div className={`relative flex-1 flex items-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="absolute left-3"><SearchIcon /></span>
                    <input
                        className={`${inputBase} pl-9`}
                        placeholder="Search by URL, method, or risk level..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-[#111111] border-[#1e1e1e] text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
                    <FilterIcon />
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className={`bg-transparent outline-none cursor-pointer text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                        <option value="all">ALL RISKS</option>
                        <option value="high">HIGH</option>
                        <option value="medium">MEDIUM</option>
                        <option value="low">LOW</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-[#111111] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full cyber-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Method</th>
                                <th>URL</th>
                                <th>Status</th>
                                <th>Risk Score</th>
                                <th>Risk Level</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={`text-center py-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        No results found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((log, i) => {
                                    const url = log.url || '';
                                    const shortUrl = url.length > 50 ? url.substring(0, 50) + '…' : url;
                                    const time = log.timestamp
                                        ? new Date(log.timestamp).toLocaleString('en-IN')
                                        : '—';
                                    const isExpanded = expandedId === i;

                                    return (
                                        <React.Fragment key={i}>
                                            <tr>
                                                <td className="font-mono text-xs">{time}</td>
                                                <td>
                                                    <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                        {log.method || 'GET'}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-xs max-w-xs" title={url}>{shortUrl}</td>
                                                <td>
                                                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${log.status_code >= 400
                                                            ? 'bg-red-500/10 text-red-400'
                                                            : 'bg-green-500/10 text-green-400'
                                                        }`}>
                                                        {log.status_code}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-sm font-semibold">
                                                    {log.risk_score !== undefined ? `${(log.risk_score * 100).toFixed(1)}%` : '—'}
                                                </td>
                                                <td><RiskBadge level={log.risk_level} /></td>
                                                <td>
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : i)}
                                                        className="text-xs font-mono font-semibold px-3 py-1 rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                                    >
                                                        {isExpanded ? 'CLOSE' : 'DETAILS'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className={`${darkMode ? 'bg-[#0d0d0d]' : 'bg-gray-50'} px-6 py-4`}>
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Analysis Reasons</p>
                                                            {log.reasons && log.reasons.length > 0 ? (
                                                                log.reasons.map((r, j) => (
                                                                    <div key={j} className="flex items-start gap-2">
                                                                        <span className="text-amber-400 mt-0.5">▸</span>
                                                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{r}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No specific reasons recorded.</p>
                                                            )}
                                                            <div className="flex gap-6 mt-3 pt-3 border-t border-gray-800/50">
                                                                <div>
                                                                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>ML Probability: </span>
                                                                    <span className="text-xs font-mono text-cyan-400">{log.ml_probability !== undefined ? `${(log.ml_probability * 100).toFixed(1)}%` : '—'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Heuristic Score: </span>
                                                                    <span className="text-xs font-mono text-amber-400">{log.heuristic_score !== undefined ? `${(log.heuristic_score * 100).toFixed(1)}%` : '—'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>HTTPS: </span>
                                                                    <span className={`text-xs font-mono ${log.is_https ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {log.is_https ? 'Yes ✓' : 'No ✗'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={`px-4 py-3 border-t text-xs ${darkMode ? 'border-[#1e1e1e] text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                    Showing {filtered.length} of {logs.length} records
                </div>
            </div>
        </div>
    );
};

export default ThreatAnalysis;
