import React from 'react';
import { I18nContext } from '../../i18n/I18nContext';
import { trackError } from '../../services/errorTracker';

class GameErrorBoundary extends React.Component {
    static contextType = I18nContext;

    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`[GameError] ${this.props.gameName || 'Unknown'}:`, error, errorInfo);
        trackError({
            source: `game:${this.props.gameName || 'unknown'}`,
            error,
            componentStack: errorInfo.componentStack,
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false });
        if (this.props.onError) this.props.onError();
    };

    render() {
        if (this.state.hasError) {
            const { t } = this.context;
            return (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
                    <div className="text-red-400 text-lg font-bold">{t('errors.gameCrashed')}</div>
                    <button
                        onClick={this.handleRetry}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        {t('errors.retry')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GameErrorBoundary;
