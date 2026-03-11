import React, { useState } from 'react';

const CopyIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const UrlCell = ({ url, darkMode }) => {
    const [copied, setCopied] = useState(false);

    if (!url) return <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>;

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative flex items-center group max-w-[150px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[350px] w-full">
            <div
                className={`flex-1 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap cursor-default ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                title="Hover for full URL"
            >
                {url}
            </div>

            <button
                onClick={handleCopy}
                className={`ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-cyan-400' : 'hover:bg-gray-200 text-gray-500 hover:text-cyan-600'
                    }`}
                title="Copy URL"
            >
                {copied ? <CheckIcon /> : <CopyIcon />}
            </button>

            {/* Custom Tooltip that shows full URL on hover */}
            <div className={`absolute bottom-full left-0 mb-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 p-2.5 rounded shadow-xl text-xs font-mono break-all w-max max-w-[min(400px,80vw)] ${darkMode ? 'bg-gray-900 border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'
                }`}>
                {url}
            </div>
        </div>
    );
};

export default UrlCell;
