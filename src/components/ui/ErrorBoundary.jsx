import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback({ error: this.state.error, retry: this.handleRetry });
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-white p-8">
                    <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6 max-w-md text-center">
                        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-gray-400 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
