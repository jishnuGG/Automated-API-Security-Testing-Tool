import React, { useState, useMemo, useCallback } from 'react';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ──────────────────────────────────────────────────────
//  Icons
// ──────────────────────────────────────────────────────
const ChevronLeft = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);
const ChevronRight = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);
const DownloadIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// ──────────────────────────────────────────────────────
//  Calendar helpers
// ──────────────────────────────────────────────────────
function getCalendarWeeks(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const weeks = [];
    let week = [];

    // Pad leading days from previous month
    for (let i = 0; i < first.getDay(); i++) {
        week.push(null);
    }
    for (let d = 1; d <= last.getDate(); d++) {
        week.push(new Date(year, month, d));
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
    }
    return weeks;
}

function getAllDaysInMonth(year, month) {
    const last = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= last; d++) {
        days.push(toKey(new Date(year, month, d)));
    }
    return days;
}

// ──────────────────────────────────────────────────────
//  Main Component
// ──────────────────────────────────────────────────────
const ExportModal = ({ isOpen, onClose, darkMode, onExport }) => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selected, setSelected] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState('day'); // day | week | month
    const [exporting, setExporting] = useState(false);

    const weeks = useMemo(() => getCalendarWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
    const allMonthDays = useMemo(() => getAllDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);

    const isMonthFullySelected = useMemo(() => {
        return allMonthDays.length > 0 && allMonthDays.every(k => selected.has(k));
    }, [allMonthDays, selected]);

    // Navigation
    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Selection
    const toggleDay = useCallback((dateKey) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) next.delete(dateKey);
            else next.add(dateKey);
            return next;
        });
    }, []);

    const toggleWeek = useCallback((week) => {
        const keys = week.filter(Boolean).map(toKey);
        setSelected(prev => {
            const next = new Set(prev);
            const allSelected = keys.every(k => next.has(k));
            if (allSelected) keys.forEach(k => next.delete(k));
            else keys.forEach(k => next.add(k));
            return next;
        });
    }, []);

    const toggleMonth = useCallback(() => {
        setSelected(prev => {
            const next = new Set(prev);
            if (isMonthFullySelected) {
                allMonthDays.forEach(k => next.delete(k));
            } else {
                allMonthDays.forEach(k => next.add(k));
            }
            return next;
        });
    }, [allMonthDays, isMonthFullySelected]);

    const clearSelection = () => setSelected(new Set());

    const handleDayClick = useCallback((date, week) => {
        if (!date) return;
        if (selectionMode === 'week') {
            toggleWeek(week);
        } else {
            toggleDay(toKey(date));
        }
    }, [selectionMode, toggleDay, toggleWeek]);

    // Compute range
    const sortedDates = useMemo(() => {
        return [...selected].sort();
    }, [selected]);

    const startDate = sortedDates.length > 0 ? sortedDates[0] : null;
    const endDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

    // Export handler
    const handleExport = async (format) => {
        if (!startDate || !endDate) return;
        setExporting(true);
        try {
            await onExport(startDate, endDate, format);
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    const dm = darkMode; // shorthand

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="export-modal-backdrop">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
                relative w-full max-w-lg rounded-xl border shadow-2xl
                ${dm
                    ? 'bg-[#0f0f0f]/95 border-[#1e1e1e] shadow-cyan-500/5'
                    : 'bg-white/95 border-gray-200 shadow-lg'}
                backdrop-blur-md
            `}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${dm ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-400"><CalendarIcon /></span>
                        <h2 className={`text-sm font-bold tracking-widest uppercase font-mono ${dm ? 'text-white' : 'text-gray-900'}`}>
                            Export Security Logs
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${dm ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Selection mode + Month nav */}
                <div className={`px-6 pt-4 pb-2 flex items-center justify-between`}>
                    {/* Mode switcher */}
                    <div className={`flex rounded-lg border overflow-hidden text-xs font-mono font-semibold ${dm ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                        {[
                            { id: 'day', label: 'Day' },
                            { id: 'week', label: 'Week' },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectionMode(m.id)}
                                className={`px-3 py-1.5 transition-colors ${selectionMode === m.id
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : dm ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Month nav */}
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className={`p-1 rounded-lg transition-colors ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                            <ChevronLeft />
                        </button>
                        <span className={`text-sm font-semibold font-mono min-w-[140px] text-center ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} className={`p-1 rounded-lg transition-colors ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                            <ChevronRight />
                        </button>
                    </div>
                </div>

                {/* Select Month checkbox */}
                <div className="px-6 pb-2 flex items-center gap-2">
                    <label className={`flex items-center gap-2 cursor-pointer text-xs font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        <input
                            type="checkbox"
                            checked={isMonthFullySelected}
                            onChange={toggleMonth}
                            className="w-3.5 h-3.5 rounded border-gray-500 accent-cyan-500"
                        />
                        Select entire {MONTH_NAMES[viewMonth]}
                    </label>
                    {selected.size > 0 && (
                        <button onClick={clearSelection} className="text-xs font-mono text-red-400 hover:text-red-300 ml-auto transition-colors">
                            Clear all
                        </button>
                    )}
                </div>

                {/* Calendar grid */}
                <div className="px-6 pb-3">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAY_LABELS.map(d => (
                            <div key={d} className={`text-[10px] font-mono font-semibold text-center py-1 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                                {d}
                            </div>
                        ))}
                    </div>
                    {/* Weeks */}
                    {weeks.map((week, wi) => {
                        const weekDayKeys = week.filter(Boolean).map(toKey);
                        const isWeekFullySelected = weekDayKeys.length > 0 && weekDayKeys.every(k => selected.has(k));

                        return (
                            <div
                                key={wi}
                                className={`grid grid-cols-7 gap-1 mb-1 rounded-lg transition-colors ${selectionMode === 'week'
                                    ? (isWeekFullySelected
                                        ? (dm ? 'bg-cyan-500/10' : 'bg-cyan-50')
                                        : dm ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                                    : ''
                                    }`}
                            >
                                {week.map((date, di) => {
                                    if (!date) {
                                        return <div key={di} className="w-full aspect-square" />;
                                    }
                                    const key = toKey(date);
                                    const isSelected = selected.has(key);
                                    const isToday = key === toKey(today);

                                    return (
                                        <button
                                            key={di}
                                            onClick={() => handleDayClick(date, week)}
                                            className={`
                                                w-full aspect-square rounded-lg text-xs font-mono font-medium
                                                flex items-center justify-center transition-all duration-150
                                                ${isSelected
                                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                                    : isToday
                                                        ? dm
                                                            ? 'bg-gray-800 text-cyan-400 ring-1 ring-cyan-500/30'
                                                            : 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200'
                                                        : dm
                                                            ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Selected range summary */}
                <div className={`px-6 py-3 border-t ${dm ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    {selected.size > 0 ? (
                        <div className={`text-xs font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="text-cyan-400 font-semibold">{selected.size}</span> day{selected.size !== 1 ? 's' : ''} selected
                            {startDate && endDate && (
                                <span className={`ml-2 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                                    — {startDate} → {endDate}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className={`text-xs font-mono ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                            Select dates to export logs
                        </div>
                    )}
                </div>

                {/* Export buttons */}
                <div className={`px-6 py-4 border-t flex items-center gap-3 ${dm ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
                    <button
                        onClick={() => handleExport('csv')}
                        disabled={selected.size === 0 || exporting}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold font-mono
                            transition-all duration-200
                            ${selected.size === 0 || exporting
                                ? 'opacity-40 cursor-not-allowed border-gray-700 text-gray-600'
                                : dm
                                    ? 'border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60'
                                    : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50'
                            }
                        `}
                    >
                        <DownloadIcon />
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <button
                        onClick={() => handleExport('xlsx')}
                        disabled={selected.size === 0 || exporting}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold font-mono
                            transition-all duration-200
                            ${selected.size === 0 || exporting
                                ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-600'
                                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20'
                            }
                        `}
                    >
                        <DownloadIcon />
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
