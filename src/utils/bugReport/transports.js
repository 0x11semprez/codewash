// Ways to deliver a bug report. Each transport has the same shape: send(report, files).
// The fetch and URL opener are arguments, so tests can pass fakes.
import { formatReportText } from './buildReport.js';

export const HTTP_TIMEOUT_MS = 15000;
// Long mailto URLs are cut by some mail apps, so the body is kept short.
export const MAX_MAILTO_BODY = 1800;

export const createHttpTransport = ({ endpoint, fetchImpl = (...args) => fetch(...args) }) => ({
    kind: 'http',
    async send(report, files = []) {
        const body = new FormData();
        body.append('report', new Blob([JSON.stringify(report)], { type: 'application/json' }), 'report.json');
        files.forEach((file) => body.append('attachments', file, file.name));
        const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(HTTP_TIMEOUT_MS) : undefined;
        const response = await fetchImpl(endpoint, { method: 'POST', body, signal });
        if (!response.ok) throw new Error(`The server answered with status ${response.status}.`);
        return { kind: 'http' };
    },
});

export const buildMailtoUrl = (email, report) => {
    let text = formatReportText(report);
    if (text.length > MAX_MAILTO_BODY) {
        text = `${text.slice(0, MAX_MAILTO_BODY)}\n\n[Cut. Download the full report as JSON and attach it.]`;
    }
    const subject = `Bug report: ${report.description.slice(0, 60)}`;
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
};

export const createMailtoTransport = ({ email, openUrl = (url) => window.location.assign(url) }) => ({
    kind: 'mailto',
    async send(report) {
        openUrl(buildMailtoUrl(email, report));
        return { kind: 'mailto' };
    },
});

// Uses the HTTP endpoint when one is set, else opens the player's mail app.
export const createTransport = (config, { fetchImpl, openUrl } = {}) =>
    config.endpoint
        ? createHttpTransport({ endpoint: config.endpoint, fetchImpl })
        : createMailtoTransport({ email: config.email, openUrl });

// Saves the report as a JSON file. Useful with mailto, which cannot carry attachments.
export const downloadReportJson = (report, { doc = document, urlApi = URL } = {}) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = urlApi.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = `bug-report-${report.createdAt.replace(/[:.]/g, '-')}.json`;
    doc.body.appendChild(link);
    link.click();
    link.remove();
    urlApi.revokeObjectURL(url);
};
