const THRESHOLDS = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    CLS: [0.1, 0.25],
};

export const rateMetric = (name, value) => {
    const [good, poor] = THRESHOLDS[name] || [Infinity, Infinity];
    if (value <= good) return 'good';
    return value <= poor ? 'needs-improvement' : 'poor';
};

const observe = (type, handler) => {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
        const observer = new PerformanceObserver((list) => handler(list.getEntries()));
        observer.observe({ type, buffered: true });
    } catch {
        return;
    }
};

export const reportWebVitals = (onReport = () => {}) => {
    const report = (name, value) => onReport({ name, value, rating: rateMetric(name, value) });
    let lcp = null;
    let cls = 0;

    observe('paint', (entries) => {
        entries
            .filter((entry) => entry.name === 'first-contentful-paint')
            .forEach((entry) => report('FCP', entry.startTime));
    });
    observe('largest-contentful-paint', (entries) => {
        lcp = entries[entries.length - 1].startTime;
    });
    observe('layout-shift', (entries) => {
        entries.forEach((entry) => {
            if (!entry.hadRecentInput) cls += entry.value;
        });
    });

    document.addEventListener(
        'visibilitychange',
        () => {
            if (document.visibilityState !== 'hidden') return;
            if (lcp !== null) report('LCP', lcp);
            report('CLS', cls);
        },
        { once: true },
    );
};
