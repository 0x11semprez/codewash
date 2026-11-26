import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const LoadingScreen = ({ progress, ready, failedCount = 0, onContinue }) => {
    const { t } = useTranslation();
    return (
        <div
            className={`loading-screen${ready ? ' loading-screen--leaving' : ''}`}
            data-loading-screen="true"
            role="status"
            aria-live="polite"
            aria-label={ready ? t('loading.ariaReady') : t('loading.ariaLoading', { progress })}
        >
            <div className="loading-screen__brand" aria-hidden="true">
                <div className="loading-screen__wordmark">MINECRAFT</div>
                <div className="loading-screen__studio">GAME STUDIOS</div>
            </div>

            <div className="loading-screen__progress-area">
                {failedCount > 0 && (
                    <div className="loading-screen__error" role="alert">
                        {t('loading.failed', { count: failedCount })}
                        <button className="loading-screen__continue" onClick={onContinue}>
                            {t('loading.continue')}
                        </button>
                    </div>
                )}
                <div className="loading-screen__status">
                    <span>
                        {failedCount > 0 ? t('loading.incomplete') : ready ? t('loading.ready') : t('loading.loading')}
                    </span>
                    <span>{progress}%</span>
                </div>
                <div
                    className="loading-screen__track"
                    role="progressbar"
                    aria-label={t('loading.progressLabel')}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progress}
                >
                    <div className="loading-screen__fill" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
