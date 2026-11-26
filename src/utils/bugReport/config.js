// Where bug reports go. Both values come from Vite env variables at build time.
// VITE_BUG_REPORT_ENDPOINT: an http(s) URL that accepts a multipart POST.
// VITE_BUG_REPORT_EMAIL: an address used for the mailto fallback.
// Invalid values are ignored, so a typo never sends reports to a broken place.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_PATTERN.test(value);

const isHttpUrl = (value) => {
    try {
        const { protocol } = new URL(value);
        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
};

export const readBugReportConfig = (env = import.meta.env) => {
    const endpoint = String(env.VITE_BUG_REPORT_ENDPOINT ?? '').trim();
    const email = String(env.VITE_BUG_REPORT_EMAIL ?? '').trim();
    return {
        endpoint: isHttpUrl(endpoint) ? endpoint : '',
        email: isValidEmail(email) ? email : '',
    };
};
