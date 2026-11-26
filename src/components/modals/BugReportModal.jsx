import React, { useEffect, useMemo, useState } from 'react';
import { X, Paperclip, Download, Send } from 'lucide-react';
import { readBugReportConfig, isValidEmail } from '../../utils/bugReport/config.js';
import { ACCEPTED_TYPES, MAX_FILES, MAX_FILE_BYTES, addFiles, formatBytes } from '../../utils/bugReport/attachments.js';
import { appLogBuffer } from '../../utils/bugReport/logBuffer.js';
import { buildReport } from '../../utils/bugReport/buildReport.js';
import { createTransport, downloadReportJson } from '../../utils/bugReport/transports.js';
import { useTranslation } from '../../i18n/useTranslation';

const fieldClass =
    'w-full bg-black/30 border-2 border-stone-600 rounded-lg px-3 py-2 text-white focus:border-slate-300 outline-none';
const labelClass = 'block text-left text-stone-300 font-bold uppercase tracking-wider text-sm mb-1';
const buttonClass =
    'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold uppercase tracking-wider transition-all border-2';

const DEFAULT_CONFIG = readBugReportConfig();

const BugReportModal = ({
    isOpen,
    onClose,
    context = {},
    config = DEFAULT_CONFIG,
    transport,
    logBuffer = appLogBuffer,
    download = downloadReportJson,
}) => {
    const { t } = useTranslation();
    const activeTransport = useMemo(() => transport ?? createTransport(config), [transport, config]);
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [reporterEmail, setReporterEmail] = useState('');
    const [files, setFiles] = useState([]);
    const [fileErrors, setFileErrors] = useState([]);
    const [includeLogs, setIncludeLogs] = useState(true);
    const [formError, setFormError] = useState('');
    const [status, setStatus] = useState({ state: 'idle', message: '' });
    const logs = useMemo(() => (isOpen ? logBuffer.getEntries() : []), [isOpen, logBuffer]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const makeReport = () =>
        buildReport({ description, steps, reporterEmail, context, logs: includeLogs ? logs : [], files });

    const handleFiles = (event) => {
        const result = addFiles(files, Array.from(event.target.files ?? []), {
            badType: (name) => t('bugReport.fileBadType', { name }),
            tooLarge: (name, limit) => t('bugReport.fileTooLarge', { name, limit }),
            tooMany: (name, max) => t('bugReport.fileTooMany', { name, max }),
        });
        setFiles(result.files);
        setFileErrors(result.errors);
        event.target.value = '';
    };

    const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!description.trim()) return setFormError(t('bugReport.descriptionRequired'));
        if (reporterEmail.trim() && !isValidEmail(reporterEmail.trim())) {
            return setFormError(t('bugReport.emailInvalid'));
        }
        setFormError('');
        setStatus({ state: 'sending', message: '' });
        try {
            const result = await activeTransport.send(makeReport(), files);
            const kind = result.kind === 'mailto' ? 'mailto' : 'http';
            setStatus({ state: 'success', message: t(`bugReport.success.${kind}`) });
        } catch (error) {
            setStatus({ state: 'error', message: t('bugReport.sendFailed', { reason: error.message }) });
        }
    };

    const isSending = status.state === 'sending';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bug-report-title"
                className="relative bg-stone-900 border-4 border-stone-600 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('bugReport.close')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                <h2
                    id="bug-report-title"
                    className="text-3xl font-bold text-slate-300 uppercase tracking-wider mb-4 text-center"
                >
                    {t('bugReport.title')}
                </h2>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="bug-description" className={labelClass}>
                            {t('bugReport.description')}
                        </label>
                        <textarea
                            id="bug-description"
                            rows={3}
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="bug-steps" className={labelClass}>
                            {t('bugReport.steps')}
                        </label>
                        <textarea
                            id="bug-steps"
                            rows={3}
                            value={steps}
                            onChange={(e) => setSteps(e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="bug-email" className={labelClass}>
                            {t('bugReport.email')}
                        </label>
                        <input
                            id="bug-email"
                            type="email"
                            value={reporterEmail}
                            onChange={(e) => setReporterEmail(e.target.value)}
                            className={fieldClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="bug-files" className={labelClass}>
                            <Paperclip size={16} className="inline mr-1" />
                            {t('bugReport.files')}
                        </label>
                        <input
                            id="bug-files"
                            type="file"
                            multiple
                            accept={ACCEPTED_TYPES}
                            onChange={handleFiles}
                            className="w-full text-stone-300 text-sm"
                        />
                        <p className="text-stone-500 text-xs text-left mt-1">
                            {t('bugReport.filesHint', { max: MAX_FILES, size: formatBytes(MAX_FILE_BYTES) })}
                        </p>
                        {files.length > 0 && (
                            <ul className="mt-2 text-left text-sm text-stone-300">
                                {files.map((file, i) => (
                                    <li key={`${file.name}-${i}`} className="flex justify-between gap-2">
                                        <span className="truncate">
                                            {file.name} ({formatBytes(file.size)})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            aria-label={t('bugReport.removeFile', { name: file.name })}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <X size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {fileErrors.map((message) => (
                            <p key={message} role="alert" className="text-red-400 text-sm text-left">
                                {message}
                            </p>
                        ))}
                    </div>
                    <div className="text-left">
                        <label className="flex items-center gap-2 text-stone-300">
                            <input
                                type="checkbox"
                                checked={includeLogs}
                                onChange={(e) => setIncludeLogs(e.target.checked)}
                            />
                            {t('bugReport.includeLogs', { count: logs.length })}
                        </label>
                        {includeLogs && logs.length > 0 && (
                            <pre
                                aria-label={t('bugReport.logPreview')}
                                className="mt-2 max-h-32 overflow-auto bg-black/40 border border-stone-700 rounded p-2 text-xs text-stone-400 whitespace-pre-wrap"
                            >
                                {logs.map((log) => `[${log.level}] ${log.message}`).join('\n')}
                            </pre>
                        )}
                    </div>
                    {formError && (
                        <p role="alert" className="text-red-400 text-sm">
                            {formError}
                        </p>
                    )}
                    {status.message && (
                        <p
                            role="status"
                            className={`text-sm ${status.state === 'error' ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {status.message}
                        </p>
                    )}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => download(makeReport())}
                            disabled={!description.trim()}
                            className={`${buttonClass} flex-1 bg-stone-700 hover:bg-stone-600 text-white border-stone-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Download size={18} /> JSON
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className={`${buttonClass} flex-1 bg-red-600 hover:bg-red-500 text-white border-red-400 disabled:opacity-50 disabled:cursor-wait`}
                        >
                            <Send size={18} /> {isSending ? t('bugReport.sending') : t('bugReport.send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BugReportModal;
