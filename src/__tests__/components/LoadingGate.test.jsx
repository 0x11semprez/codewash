import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../App.jsx', () => ({
    default: ({ startupLoadSeconds }) => <div data-testid="app">{String(startupLoadSeconds)}</div>,
}));
vi.mock('../../components/ui/GlobalStyles.css', () => ({}));

const preload = vi.fn();
vi.mock('../../utils/preloadStartupAssets.js', () => ({ preloadStartupAssets: (...a) => preload(...a) }));

import LoadingGate from '../../components/LoadingGate';

describe('LoadingGate', () => {
    it('shows progress then reveals the game with elapsed time', async () => {
        preload.mockImplementation(async (onProgress) => {
            onProgress({ percent: 50 });
            return { failedCritical: [] };
        });
        render(<LoadingGate />);
        expect(screen.getByTestId('app')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('GAME READY')).toBeInTheDocument());
        await waitFor(() => expect(document.querySelector('[data-loading-screen]')).toBeNull(), { timeout: 2000 });
        expect(screen.getByTestId('app').textContent).not.toBe('null');
    });

    it('offers Continue when critical images fail', async () => {
        preload.mockResolvedValue({ failedCritical: ['a.png'] });
        render(<LoadingGate />);
        await waitFor(() => expect(screen.getByText('LOADING INCOMPLETE')).toBeInTheDocument());
        fireEvent.click(screen.getByText('CONTINUE'));
        await waitFor(() => expect(document.querySelector('[data-loading-screen]')).toBeNull(), { timeout: 2000 });
    });

    it('treats a preload crash as a critical failure', async () => {
        preload.mockRejectedValue(new Error('boom'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<LoadingGate />);
        await waitFor(() => expect(screen.getByText('LOADING INCOMPLETE')).toBeInTheDocument());
    });

    it('preloads only once when React runs the effect twice in strict mode', async () => {
        preload.mockClear();
        preload.mockResolvedValue({ failedCritical: [] });
        render(
            <React.StrictMode>
                <LoadingGate />
            </React.StrictMode>,
        );
        await waitFor(() => expect(screen.getByText('GAME READY')).toBeInTheDocument());
        expect(preload).toHaveBeenCalledOnce();
    });
});
