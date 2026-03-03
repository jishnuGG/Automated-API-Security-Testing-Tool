import React from 'react';

const icons = {
    dashboard: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    ),
    analysis: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    logs: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    shield: (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
};

const navItems = [
    { id: 'dashboard', label: 'Threat Monitoring', icon: icons.dashboard },
    { id: 'analysis', label: 'Threat Analysis', icon: icons.analysis },
    { id: 'logs', label: 'Attack Logs', icon: icons.logs },
];

const Sidebar = ({ currentPage, setCurrentPage, darkMode }) => {
    return (
        <div className={`
      flex flex-col items-center w-16 h-screen fixed left-0 top-0 z-20 py-4 gap-2
      ${darkMode
                ? 'bg-[#0a0a0a] border-r border-[#1e1e1e]'
                : 'bg-white border-r border-gray-200'}
    `}>
            {/* Logo */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-4">
                {icons.shield}
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        title={item.label}
                        className={`
              flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer border
              ${currentPage === item.id
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                : darkMode
                                    ? 'text-gray-600 hover:text-gray-300 hover:bg-gray-800/50 border-transparent hover:border-gray-700'
                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent'}
            `}
                    >
                        {item.icon}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
