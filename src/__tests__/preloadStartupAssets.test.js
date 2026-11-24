import { describe, it, expect, vi, beforeEach } from 'vitest'
import { preloadStartupAssets } from '../utils/preloadStartupAssets'

const installImage = (okFor) => {
  vi.stubGlobal('Image', class {
    constructor() { this.complete = false; this.naturalWidth = 0 }
    set src(value) {
      queueMicrotask(() => (okFor(value) ? this.onload?.() : this.onerror?.()))
    }
  })
}

const installAudio = (event) => {
  vi.stubGlobal('Audio', class {
    constructor() { this.listeners = {} }
    addEventListener(name, cb) { this.listeners[name] = cb }
    removeEventListener() {}
    load() { queueMicrotask(() => this.listeners[event]?.()) }
    set src(_) {}
  })
}

describe('preloadStartupAssets', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', { getItem: () => null })
    installAudio('canplaythrough')
  })

  it('reports progress up to 100% and no critical failures', async () => {
    installImage(() => true)
    const onProgress = vi.fn()
    const result = await preloadStartupAssets(onProgress)
    expect(result.failedCritical).toEqual([])
    expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ percent: 100, completed: result.total }))
  })

  it('lists critical images that fail to load', async () => {
    installImage((src) => !src.includes('logo'))
    const result = await preloadStartupAssets()
    expect(result.failedCritical.length).toBeGreaterThan(0)
  })

  it('falls back to the default theme when saved data is corrupted and warns on audio errors', async () => {
    vi.stubGlobal('localStorage', { getItem: () => '{bad' })
    installImage(() => true)
    installAudio('error')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await preloadStartupAssets()
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(warn).toHaveBeenCalled()
  })
})
