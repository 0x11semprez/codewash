import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import App from '../App.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import { preloadStartupAssets } from '../utils/preloadStartupAssets.js';

const LoadingGate = () => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('loading');
    const [startedAt] = useState(() => performance.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const preloadRef = useRef(null);

    const finishPreloading = useCallback((failedCritical = 0) => {
        setProgress(100);
        setElapsedSeconds((performance.now() - startedAt) / 1000);
        if (failedCritical > 0) {
            setFailedCount(failedCritical);
            setPhase('error');
            return;
        }
        setPhase('transition');
        window.setTimeout(() => setPhase('done'), 450);
    }, [startedAt]);

    useLayoutEffect(() => {
        if (preloadRef.current) return;
        preloadRef.current = preloadStartupAssets(({ percent }) => setProgress(percent))
            .then(({ failedCritical }) => {
                finishPreloading(failedCritical.length);
            })
            .catch((error) => {
                console.error('Startup asset preload failed:', error);
                finishPreloading(1);
            });
    }, [finishPreloading, startedAt]);

    return (
        <>
            <App startupLoadSeconds={phase === 'loading' || phase === 'error' ? null : elapsedSeconds} />
            {phase !== 'done' && (
                <LoadingScreen
                    progress={progress}
                    ready={phase === 'transition'}
                    failedCount={failedCount}
                    onContinue={() => {
                        setPhase('transition');
                        window.setTimeout(() => setPhase('done'), 450);
                    }}
                />
            )}
        </>
    );
};

export default LoadingGate;
