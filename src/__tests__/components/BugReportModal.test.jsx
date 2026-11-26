import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BugReportModal from '../../components/modals/BugReportModal';
import { createLogBuffer } from '../../utils/bugReport/logBuffer.js';
import I18nProvider from '../../i18n/I18nProvider';

const makeLogs = (...messages) => {
    const buffer = createLogBuffer({ clock: () => 0 });
    messages.forEach((message) => buffer.add('error', [message]));
    return buffer;
};

const renderModal = (props = {}) => {
    const transport = { send: vi.fn().mockResolvedValue({ kind: 'http' }) };
    const onClose = vi.fn();
    render(
        <BugReportModal
            isOpen={true}
            onClose={onClose}
            transport={transport}
            logBuffer={makeLogs()}
            context={{ profileId: 3, theme: 'pokemon' }}
            {...props}
        />,
    );
    return { transport: props.transport ?? transport, onClose };
};

const describeBug = (text = 'Boss never dies') =>
    fireEvent.change(screen.getByLabelText(/What happened/), { target: { value: text } });

describe('BugReportModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(<BugReportModal isOpen={false} onClose={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders the form when open', () => {
        render(<BugReportModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByRole('dialog', { name: 'Discovered a bug?' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Steps to reproduce/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Your email/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Screenshots or files/)).toBeInTheDocument();
        expect(screen.getByText(/Up to 3 files, 5.0 MB each/)).toBeInTheDocument();
    });

    it('closes on backdrop click, close button and Escape', () => {
        const { onClose } = renderModal();
        fireEvent.click(document.querySelector('.bg-black\\/70'));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        fireEvent.keyDown(window, { key: 'Escape' });
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('requires a description', () => {
        const { transport } = renderModal();
        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        expect(screen.getByRole('alert')).toHaveTextContent('Please describe the bug.');
        expect(transport.send).not.toHaveBeenCalled();
    });

    it('rejects an invalid reporter email', () => {
        const { transport } = renderModal();
        describeBug();
        fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        expect(screen.getByRole('alert')).toHaveTextContent('does not look valid');
        expect(transport.send).not.toHaveBeenCalled();
    });

    it('sends the report with files and logs, then shows success', async () => {
        const { transport } = renderModal({ logBuffer: makeLogs('TypeError: x is undefined') });
        describeBug();
        fireEvent.change(screen.getByLabelText(/Steps/), { target: { value: 'Open reading' } });
        fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: 'mom@example.test' } });
        const shot = new File(['png'], 'shot.png', { type: 'image/png' });
        fireEvent.change(screen.getByLabelText(/Screenshots or files/), { target: { files: [shot] } });
        expect(screen.getByText(/shot\.png/)).toBeInTheDocument();
        expect(screen.getByLabelText('Log preview')).toHaveTextContent('TypeError: x is undefined');

        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();

        expect(await screen.findByRole('status')).toHaveTextContent('Your report was sent');
        const [report, files] = transport.send.mock.calls[0];
        expect(report).toMatchObject({
            description: 'Boss never dies',
            steps: 'Open reading',
            reporterEmail: 'mom@example.test',
            context: { profileId: 3, theme: 'pokemon' },
            attachments: [{ name: 'shot.png', type: 'image/png' }],
        });
        expect(report.logs).toHaveLength(1);
        expect(files).toEqual([shot]);
    });

    it('leaves logs out when the box is unchecked and lets the user remove a file', async () => {
        const { transport } = renderModal({ logBuffer: makeLogs('secret-free error') });
        describeBug();
        fireEvent.click(screen.getByLabelText(/Include recent error logs \(1\)/));
        expect(screen.queryByLabelText('Log preview')).not.toBeInTheDocument();
        const note = new File(['log'], 'game.log', { type: 'text/plain' });
        fireEvent.change(screen.getByLabelText(/Screenshots or files/), { target: { files: [note] } });
        fireEvent.click(screen.getByRole('button', { name: 'Remove game.log' }));

        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        await screen.findByRole('status');
        const [report, files] = transport.send.mock.calls[0];
        expect(report.logs).toEqual([]);
        expect(files).toEqual([]);
    });

    it('shows file errors for rejected files', () => {
        renderModal();
        const exe = new File(['x'], 'game.exe', { type: 'application/octet-stream' });
        fireEvent.change(screen.getByLabelText(/Screenshots or files/), { target: { files: [exe] } });
        expect(screen.getByRole('alert')).toHaveTextContent('game.exe: only images');
    });

    it('explains why a file is too large or one file too many', () => {
        renderModal();
        const big = new File(['x'], 'huge.png', { type: 'image/png' });
        Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
        const images = ['a.png', 'b.png', 'c.png', 'd.png'].map((name) => new File(['x'], name, { type: 'image/png' }));
        fireEvent.change(screen.getByLabelText(/Screenshots or files/), { target: { files: [big, ...images] } });
        const text = screen
            .getAllByRole('alert')
            .map((alert) => alert.textContent)
            .join(' ');
        expect(text).toContain('huge.png');
        expect(text).toContain('d.png');
    });

    it('accepts a file input change with no file list', () => {
        renderModal();
        fireEvent.change(screen.getByLabelText(/Screenshots or files/), { target: { files: null } });
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('shows the mailto hint after a mailto send', async () => {
        const transport = { send: vi.fn().mockResolvedValue({ kind: 'mailto' }) };
        renderModal({ transport });
        describeBug();
        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        expect(await screen.findByRole('status')).toHaveTextContent('mail app should open');
    });

    it('shows an error when sending fails', async () => {
        const transport = { send: vi.fn().mockRejectedValue(new Error('Network down.')) };
        renderModal({ transport });
        describeBug();
        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sending failed. Network down.'));
        expect(screen.getByRole('button', { name: /Send/ })).toBeEnabled();
    });

    it('downloads the report as JSON', () => {
        const download = vi.fn();
        renderModal({ download });
        const button = screen.getByRole('button', { name: /JSON/ });
        expect(button).toBeDisabled();
        describeBug();
        fireEvent.click(button);
        expect(download).toHaveBeenCalledWith(expect.objectContaining({ description: 'Boss never dies' }));
    });

    it('builds the transport from config when none is given', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true });
        render(
            <BugReportModal
                isOpen={true}
                onClose={() => {}}
                config={{ endpoint: 'https://example.test/bugs', email: '' }}
            />,
        );
        describeBug();
        fireEvent.click(screen.getByRole('button', { name: /Send/ }));
        expect(await screen.findByRole('status')).toHaveTextContent('Your report was sent');
        expect(fetchSpy).toHaveBeenCalledWith('https://example.test/bugs', expect.objectContaining({ method: 'POST' }));
        fetchSpy.mockRestore();
    });
});

describe('BugReportModal in French', () => {
    const inFrench = (ui) => render(<I18nProvider initialLanguage="fr">{ui}</I18nProvider>);

    it('shows the form and its messages in French', () => {
        inFrench(<BugReportModal isOpen={true} onClose={() => {}} logBuffer={makeLogs()} />);
        expect(screen.getByRole('heading', { name: 'Tu as trouvé un bug ?' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
        expect(screen.getByRole('alert').textContent).toBe("Décris le bug, s'il te plaît.");
    });

    it('translates the message for a rejected file', () => {
        inFrench(<BugReportModal isOpen={true} onClose={() => {}} logBuffer={makeLogs()} />);
        const file = new File(['x'], 'virus.exe', { type: 'application/x-msdownload' });
        fireEvent.change(screen.getByLabelText(/Captures/), { target: { files: [file] } });
        expect(screen.getByRole('alert').textContent).toContain('virus.exe : seuls les images');
    });
});
