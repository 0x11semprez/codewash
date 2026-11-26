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

    it('shows an error for a wrong word and hides it once the player types again', () => {
        const onConfirm = vi.fn();
        render(<ResetModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'DEL' } });
        fireEvent.submit(input.closest('form'));
        expect(screen.getByText('Please type DELETE to confirm.')).toBeInTheDocument();
        expect(onConfirm).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { value: 'DELE' } });
        expect(screen.queryByText('Please type DELETE to confirm.')).toBeNull();
    });

    it('ignores text longer than the word and focuses the input when a letter slot is clicked', () => {
        render(<ResetModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'DELETED' } });
        expect(input).toHaveValue('');
        input.blur();
        fireEvent.click(screen.getAllByText('', { selector: '.w-10' })[0]);
        expect(document.activeElement).toBe(input);
    });

    it('closes from the backdrop, the close button and the cancel button', () => {
        const onClose = vi.fn();
        const { container } = render(<ResetModal isOpen={true} onClose={onClose} onConfirm={() => {}} />);
        fireEvent.click(container.querySelector('.backdrop-blur-sm'));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(3);
    });
});
