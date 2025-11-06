import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: React.ErrorInfo;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="max-w-xl w-full mx-4 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-200">
            <div className="font-semibold text-red-300 mb-2">Something went wrong</div>
            <div className="text-sm text-red-200/90">
              {this.state.error?.message || 'Unknown error'}
            </div>
            {this.state.info?.componentStack ? (
              <pre className="mt-3 text-xs whitespace-pre-wrap opacity-80">
                {this.state.info.componentStack}
              </pre>
            ) : null}
            <button
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
              onClick={() => (window.location.href = window.location.href)}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}



