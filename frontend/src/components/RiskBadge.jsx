import React from 'react';

const RiskBadge = ({ level }) => {
    const normalized = (level || '').toLowerCase();
    const classes = {
        high: 'bg-red-500/20 text-red-400 border border-red-500/40',
        medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
        low: 'bg-green-500/20 text-green-400 border border-green-500/40',
        critical: 'bg-red-900/50 text-red-300 border border-red-700',
    };
    return (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-widest font-mono ${classes[normalized] || 'bg-gray-700 text-gray-300 border border-gray-600'}`}>
            {level || 'N/A'}
        </span>
    );
};

export default RiskBadge;
