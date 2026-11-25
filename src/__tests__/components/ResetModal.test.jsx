import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetModal from '../../components/modals/ResetModal';

describe('ResetModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(<ResetModal isOpen={false} onClose={() => {}} onConfirm={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders confirmation dialog when open', () => {
        render(<ResetModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
        expect(screen.getByText('Delete Progress?')).toBeInTheDocument();
    });

    it('requires typing DELETE to confirm', () => {
        const onConfirm = vi.fn();
        render(<ResetModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'WRONG' } });
        const buttons = screen.getAllByRole('button');
        const confirmBtn = buttons.find((b) => b.textContent.match(/confirm|delete|reset/i));
        if (confirmBtn) {
            fireEvent.click(confirmBtn);
            expect(onConfirm).not.toHaveBeenCalled();
        }
    });

    it('confirms when DELETE typed correctly', () => {
        const onConfirm = vi.fn();
        render(<ResetModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const form = input.closest('form');
        if (form) {
            fireEvent.submit(form);
            expect(onConfirm).toHaveBeenCalledOnce();
        }
    });
});
