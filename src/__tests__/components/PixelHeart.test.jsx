import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PixelHeart from '../../components/ui/PixelHeart';

describe('PixelHeart', () => {
  it('renders SVG element', () => {
    const { container } = render(<PixelHeart />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('defaults to size 32', () => {
    const { container } = render(<PixelHeart />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('accepts custom size', () => {
    const { container } = render(<PixelHeart size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
  });

  it('renders filled heart with red pixels', () => {
    const { container } = render(<PixelHeart filled={true} />);
    const rects = container.querySelectorAll('rect');
    const fills = Array.from(rects).map(r => r.getAttribute('fill'));
    expect(fills).toContain('#F22830');
  });

  it('renders empty heart with gray pixels', () => {
    const { container } = render(<PixelHeart filled={false} />);
    const rects = container.querySelectorAll('rect');
    const fills = Array.from(rects).map(r => r.getAttribute('fill'));
    expect(fills).toContain('#1f2937');
    expect(fills).not.toContain('#F22830');
  });
});
