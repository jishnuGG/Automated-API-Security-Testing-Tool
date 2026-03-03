import React from 'react';

const pageMeta = {
    dashboard: { title: 'THREAT MONITORING', subtitle: 'Real-time API security detection and analysis' },
    analysis: { title: 'THREAT ANALYSIS', subtitle: 'Detailed threat detection and explainability' },
    logs: { title: 'ATTACK LOGS', subtitle: 'Historical threat detection records' },
};

const SunIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const Header = ({ currentPage, darkMode, setDarkMode, user, onLogout }) => {
    const meta = pageMeta[currentPage] || pageMeta.dashboard;

    return (
        <header className={`
      flex items-center justify-between px-8 py-5 border-b
      ${darkMode ? 'border-[#1e1e1e]' : 'border-gray-200'}
    `}>
            <div>
                <h1 className={`text-xl font-bold tracking-widest font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {meta.title}
                </h1>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {meta.subtitle}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {/* Live badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs text-green-400 font-semibold tracking-wider">LIVE</span>
                </div>

                {/* Dark mode toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200
            ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700'
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}
          `}
                >
                    {darkMode ? <SunIcon /> : <MoonIcon />}
                    <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
                </button>

                {/* User info + logout */}
                {user && (
                    <div className="flex items-center gap-2">
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#0a0a0a', fontWeight: 700, fontSize: 13
                        }}>
                            {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <span className={`text-sm hidden md:inline ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.name || user.email}
                        </span>
                        {onLogout && (
                            <button onClick={onLogout}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
                                    ${darkMode ? 'border-red-800 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-500 hover:bg-red-50'}`}>
                                ⏻ Logout
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
