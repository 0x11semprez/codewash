import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App.jsx'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', class {
      play() { return Promise.resolve() }
      pause() {}
      addEventListener() {}
      removeEventListener() {}
    })
    const store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
      clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    })
  })

  it('module imports without error', async () => {
    const mod = await import('../App.jsx')
    expect(mod).toBeDefined()
  })

  it('does not mount drawers until first opened, then lazy-loads them', async () => {
    localStorage.clear()
    const { container } = render(<App />)
    expect(container.querySelector('.drawer, [data-drawer]')).toBeNull()
    const buttons = container.querySelectorAll('button.absolute.z-40')
    fireEvent.click(buttons[0])
    await waitFor(() => expect(screen.getAllByText(/volume|profile|reset/i).length).toBeGreaterThan(0), { timeout: 5000 })
  })

  it('shows the startup achievement toast with the load time', async () => {
    localStorage.clear()
    render(<App startupLoadSeconds={1.234} />)
    await waitFor(() => expect(screen.getByText(/loaded successfully in 1.23 seconds/)).toBeInTheDocument())
  })
})
