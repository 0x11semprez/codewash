import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BugReportModal from '../../components/modals/BugReportModal';

describe('BugReportModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(<BugReportModal isOpen={false} onClose={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders content when open', () => {
        render(<BugReportModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Discovered a bug?')).toBeInTheDocument();
    });

    it('calls onClose when backdrop clicked', () => {
        const onClose = vi.fn();
        render(<BugReportModal isOpen={true} onClose={onClose} />);
        const backdrop = document.querySelector('.bg-black\\/70');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });
});
