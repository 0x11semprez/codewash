import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParentalVerificationModal from '../../components/ui/ParentalVerificationModal';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'parental.answer': 'HELLO WORLD',
                'parental.title': 'Parent Check',
                'parental.close': 'Close',
                'parental.error': 'Wrong answer',
                'parental.submit': 'Submit',
            };
            return map[key] || key;
        },
    }),
}));

describe('ParentalVerificationModal', () => {
    const onClose = vi.fn();
    const onVerified = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when closed', () => {
        const { container } = render(
            <ParentalVerificationModal isOpen={false} onClose={onClose} onVerified={onVerified} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders modal when open', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        expect(screen.getByText('Parent Check')).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('shows error on wrong answer', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        const input = document.querySelector('input[type="text"]');
        fireEvent.change(input, { target: { value: 'WRONG' } });
        fireEvent.submit(screen.getByText('Submit').closest('form'));
        expect(screen.getByText('Wrong answer')).toBeInTheDocument();
        expect(onVerified).not.toHaveBeenCalled();
    });

    it('calls onVerified on correct answer (no spaces)', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        const input = document.querySelector('input[type="text"]');
        fireEvent.change(input, { target: { value: 'HELLOWORLD' } });
        fireEvent.submit(screen.getByText('Submit').closest('form'));
        expect(onVerified).toHaveBeenCalledOnce();
    });

    it('closes when X button clicked', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes when backdrop clicked', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        const backdrop = document.querySelector('.bg-black\\/70');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('converts input to uppercase and strips spaces', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        const input = document.querySelector('input[type="text"]');
        fireEvent.change(input, { target: { value: 'hello world' } });
        fireEvent.submit(screen.getByText('Submit').closest('form'));
        expect(onVerified).toHaveBeenCalledOnce();
    });

    it('renders slots matching answer length', () => {
        render(<ParentalVerificationModal isOpen={true} onClose={onClose} onVerified={onVerified} />);
        const letterSlots = document.querySelectorAll('.w-7');
        const spaceSlots = document.querySelectorAll('.w-4');
        expect(letterSlots.length).toBe(10);
        expect(spaceSlots.length).toBe(1);
    });
});
