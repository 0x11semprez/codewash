import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SafeImage from '../../components/ui/SafeImage';

describe('SafeImage', () => {
    it('renders img when src provided', () => {
        render(<SafeImage src="test.png" alt="Test" />);
        const img = screen.getByAltText('Test');
        expect(img.tagName).toBe('IMG');
        expect(img).toHaveAttribute('src', 'test.png');
    });

    it('renders fallback when src is empty', () => {
        render(<SafeImage src="" alt="Missing" />);
        expect(screen.getByText('Missing')).toBeInTheDocument();
    });

    it('renders fallback when src is null', () => {
        render(<SafeImage src={null} alt="Null" />);
        expect(screen.getByText('Null')).toBeInTheDocument();
    });

    it('shows fallback on image error', () => {
        render(<SafeImage src="bad.png" alt="Broken" />);
        const img = screen.getByAltText('Broken');
        fireEvent.error(img);
        expect(screen.getByText('Broken')).toBeInTheDocument();
    });

    it('applies className', () => {
        render(<SafeImage src="test.png" alt="Styled" className="custom-class" />);
        const img = screen.getByAltText('Styled');
        expect(img).toHaveClass('custom-class');
    });

    it('calls onClick', () => {
        let clicked = false;
        render(
            <SafeImage
                src="test.png"
                alt="Click"
                onClick={() => {
                    clicked = true;
                }}
            />,
        );
        fireEvent.click(screen.getByAltText('Click'));
        expect(clicked).toBe(true);
    });
});
