import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// The global stylesheet is loaded on its own chunk. This file checks the case where that chunk fails.
vi.mock('../../App.jsx', () => ({ default: () => <div data-testid="app" /> }));
vi.mock('../../components/ui/GlobalStyles.css', () => {
    throw new Error('chunk failed');
});
vi.mock('../../utils/preloadStartupAssets.js', () => ({
    preloadStartupAssets: async () => ({ failedCritical: [] }),
}));

import LoadingGate from '../../components/LoadingGate';

describe('LoadingGate without its global styles', () => {
    it('logs the style error and still opens the game', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<LoadingGate />);
        await waitFor(() => expect(screen.getByText('GAME READY')).toBeInTheDocument());
        expect(error).toHaveBeenCalledWith('Global game styles failed to load:', expect.anything());
        error.mockRestore();
    });
});
