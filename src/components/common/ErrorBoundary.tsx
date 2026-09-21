import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  silent?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (!this.props.silent) {
      console.error('[SGM ErrorBoundary caught an error]:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error || new Error('Unknown error'),
          reset: this.reset,
        });
      }

      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-950/80 border border-red-800 text-red-200 rounded-lg m-2 text-sm flex flex-col gap-2 shadow-lg backdrop-blur-md">
          <div className="font-semibold text-red-100 flex items-center gap-2">
            ⚠️ Ocorreu um erro inesperado neste módulo.
          </div>
          <div className="text-xs text-red-300/80 font-mono break-all">
            {this.state.error?.message || 'Erro desconhecido'}
          </div>
          <button
            onClick={this.reset}
            className="self-start px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs transition-colors cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
