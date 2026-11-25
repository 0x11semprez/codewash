import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateMetric, reportWebVitals } from '../utils/webVitals'

let observers

const installObserver = () => {
  observers = {}
  vi.stubGlobal('PerformanceObserver', class {
    constructor(callback) { this.callback = callback }
    observe({ type }) { observers[type] = this.callback }
  })
}

const emit = (type, entries) => observers[type]({ getEntries: () => entries })

const hidePage = () => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('rateMetric', () => {
  it('classifies values against the Core Web Vitals thresholds', () => {
    expect(rateMetric('FCP', 1000)).toBe('good')
    expect(rateMetric('FCP', 2500)).toBe('needs-improvement')
    expect(rateMetric('LCP', 5000)).toBe('poor')
    expect(rateMetric('CLS', 0.05)).toBe('good')
  })

  it('treats unknown metrics as good', () => {
    expect(rateMetric('UNKNOWN', 99999)).toBe('good')
  })
})

describe('reportWebVitals', () => {
  beforeEach(() => {
    installObserver()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports FCP as soon as the paint entry is observed', () => {
    const onReport = vi.fn()
    reportWebVitals(onReport)
    emit('paint', [{ name: 'first-paint', startTime: 10 }, { name: 'first-contentful-paint', startTime: 523 }])
    expect(onReport).toHaveBeenCalledTimes(1)
    expect(onReport).toHaveBeenCalledWith({ name: 'FCP', value: 523, rating: 'good' })
  })

  it('reports the last LCP and the accumulated CLS when the page is hidden', () => {
    const onReport = vi.fn()
    reportWebVitals(onReport)
    emit('largest-contentful-paint', [{ startTime: 400 }, { startTime: 900 }])
    emit('layout-shift', [
      { value: 0.04, hadRecentInput: false },
      { value: 0.5, hadRecentInput: true },
      { value: 0.03, hadRecentInput: false },
    ])
    expect(onReport).not.toHaveBeenCalled()
    hidePage()
    expect(onReport).toHaveBeenCalledWith({ name: 'LCP', value: 900, rating: 'good' })
    const cls = onReport.mock.calls.find(([metric]) => metric.name === 'CLS')[0]
    expect(cls.value).toBeCloseTo(0.07)
  })

  it('skips LCP when none was observed', () => {
    const onReport = vi.fn()
    reportWebVitals(onReport)
    hidePage()
    expect(onReport).toHaveBeenCalledTimes(1)
    expect(onReport.mock.calls[0][0].name).toBe('CLS')
  })

  it('does nothing when PerformanceObserver is unavailable', () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    expect(() => reportWebVitals(vi.fn())).not.toThrow()
  })

  it('ignores entry types the browser does not support', () => {
    vi.stubGlobal('PerformanceObserver', class {
      observe() { throw new TypeError('unsupported') }
    })
    expect(() => reportWebVitals(vi.fn())).not.toThrow()
  })
})
