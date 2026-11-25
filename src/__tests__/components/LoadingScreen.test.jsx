import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingScreen from '../../components/ui/LoadingScreen'

describe('LoadingScreen', () => {
  it('renders the progress percentage and progressbar value', () => {
    render(<LoadingScreen progress={42} ready={false} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
    expect(screen.getByText('LOADING GAME...')).toBeInTheDocument()
  })

  it('shows ready state and leaving class', () => {
    const { container } = render(<LoadingScreen progress={100} ready />)
    expect(screen.getByText('GAME READY')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('loading-screen--leaving')
  })

  it('shows failures and calls onContinue', () => {
    const onContinue = vi.fn()
    render(<LoadingScreen progress={100} ready={false} failedCount={2} onContinue={onContinue} />)
    expect(screen.getByRole('alert')).toHaveTextContent('2 CRITICAL IMAGES')
    fireEvent.click(screen.getByText('CONTINUE'))
    expect(onContinue).toHaveBeenCalled()
  })
})
