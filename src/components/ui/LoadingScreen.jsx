import React from 'react';

const LoadingScreen = ({ progress, ready, failedCount = 0, onContinue }) => (
    <div
        className={`loading-screen${ready ? ' loading-screen--leaving' : ''}`}
        data-loading-screen="true"
        role="status"
        aria-live="polite"
        aria-label={ready ? 'Game ready' : `Loading game: ${progress}%`}
    >
        <div className="loading-screen__brand" aria-hidden="true">
            <div className="loading-screen__wordmark">MINECRAFT</div>
            <div className="loading-screen__studio">GAME STUDIOS</div>
        </div>

        <div className="loading-screen__progress-area">
            {failedCount > 0 && (
                <div className="loading-screen__error" role="alert">
                    {failedCount} CRITICAL IMAGE{failedCount === 1 ? '' : 'S'} COULD NOT LOAD. The game can continue with missing visuals.
                    <button className="loading-screen__continue" onClick={onContinue}>CONTINUE</button>
                </div>
            )}
            <div className="loading-screen__status">
                <span>{failedCount > 0 ? 'LOADING INCOMPLETE' : ready ? 'GAME READY' : 'LOADING GAME...'}</span>
                <span>{progress}%</span>
            </div>
            <div
                className="loading-screen__track"
                role="progressbar"
                aria-label="Game loading progress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={progress}
            >
                <div className="loading-screen__fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    </div>
);

export default LoadingScreen;
