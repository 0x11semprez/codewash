// Builds the bug report as plain data, and turns it into text for an email body.
import { version } from '../../../package.json';
import { now } from '../clock.js';

export const readEnvironment = (nav = navigator, win = window) => ({
    userAgent: nav.userAgent,
    language: nav.language,
    screen: `${win.innerWidth}x${win.innerHeight}`,
});

export const buildReport = ({
    description,
    steps = '',
    reporterEmail = '',
    context = {},
    logs = [],
    files = [],
    environment = readEnvironment(),
    appVersion = version,
    clock = now,
}) => ({
    createdAt: new Date(clock()).toISOString(),
    description: description.trim(),
    steps: steps.trim(),
    reporterEmail: reporterEmail.trim(),
    appVersion,
    environment,
    context: { profileId: context.profileId ?? null, theme: context.theme ?? null },
    logs,
    attachments: files.map(({ name, type, size }) => ({ name, type, size })),
});

export const formatReportText = (report) => {
    const lines = [
        `Description:\n${report.description}`,
        `Steps to reproduce:\n${report.steps || '(none)'}`,
        `Reporter email: ${report.reporterEmail || '(none)'}`,
        `Date: ${report.createdAt}`,
        `App version: ${report.appVersion}`,
        `Profile: ${report.context.profileId ?? '?'} / Theme: ${report.context.theme ?? '?'}`,
        `User agent: ${report.environment.userAgent}`,
        `Screen: ${report.environment.screen} / Language: ${report.environment.language}`,
    ];
    if (report.attachments.length > 0) {
        lines.push(
            `Attachments:\n${report.attachments.map((file) => `- ${file.name} (${file.size} bytes)`).join('\n')}`,
        );
    }
    if (report.logs.length > 0) {
        lines.push(`Logs:\n${report.logs.map((log) => `[${log.time}] ${log.level}: ${log.message}`).join('\n')}`);
    }
    return lines.join('\n\n');
};
