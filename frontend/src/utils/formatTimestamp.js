/**
 * formatTimestamp
 * ---------------
 * Converts a UTC ISO / MongoDB timestamp to Indian Standard Time (IST)
 * and returns it as:  DD/MM/YYYY, HH:MM:SS AM/PM
 *
 * Handles:
 *  - ISO 8601 strings  e.g. "2026-03-11T07:19:22.058+00:00"
 *  - MongoDB $date strings
 *  - Date objects
 *  - null / undefined (returns '—')
 *
 * @param {string|Date|null|undefined} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return "—";

    const date = new Date(String(timestamp));

    if (isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(date);
}