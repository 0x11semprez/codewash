import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('module imports without error', async () => {
    const mod = await import('../App.jsx')
    expect(mod).toBeDefined()
  })
})
