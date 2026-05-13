
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const LOCALE = 'en-IN';

export function getTimezone() {
    return localStorage.getItem('app_timezone') || DEFAULT_TIMEZONE;
}

export function setTimezone(tz) {
    localStorage.setItem('app_timezone', tz);
    window.dispatchEvent(new Event('timezone-changed'));
}

/**
 * Full date + time: "13 May 2026, 08:20 pm"
 */
export function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return new Intl.DateTimeFormat(LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: getTimezone(),
    }).format(date);
}

/**
 * Date only: "13 May 2026"
 */
export function formatDateOnly(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return new Intl.DateTimeFormat(LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: getTimezone(),
    }).format(date);
}

/**
 * Time only: "08:20 pm"
 */
export function formatTimeOnly(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return new Intl.DateTimeFormat(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: getTimezone(),
    }).format(date);
}

/**
 * Date + time with seconds: "13 May 2026, 08:20:45 pm"
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return new Intl.DateTimeFormat(LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: getTimezone(),
    }).format(date);
}

/**
 * Short date: "13 May"
 */
export function formatShortDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return new Intl.DateTimeFormat(LOCALE, {
        day: 'numeric',
        month: 'short',
        timeZone: getTimezone(),
    }).format(date);
}

/**
 * Commonly used timezones list for Settings dropdown
 */
export const TIMEZONE_OPTIONS = [
    { value: 'Asia/Kolkata', label: '🇮🇳 India (IST)' },
    { value: 'UTC', label: '🌐 UTC' },
    { value: 'America/New_York', label: '🇺🇸 Eastern Time (ET)' },
    { value: 'America/Chicago', label: '🇺🇸 Central Time (CT)' },
    { value: 'America/Los_Angeles', label: '🇺🇸 Pacific Time (PT)' },
    { value: 'Europe/London', label: '🇬🇧 London' },
    { value: 'Europe/Paris', label: '🇫🇷 Central Europe (CET)' },
    { value: 'Europe/Moscow', label: '🇷🇺 Moscow' },
    { value: 'Asia/Dubai', label: '🇦🇪 Gulf Time (GST)' },
    { value: 'Asia/Singapore', label: '🇸🇬 Singapore' },
    { value: 'Asia/Tokyo', label: '🇯🇵 Japan (JST)' },
    { value: 'Australia/Sydney', label: '🇦🇺 Sydney (AEST)' },
];
