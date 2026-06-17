import React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Something went wrong' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-bold font-outfit">
              {this.props.title || 'Something went wrong'}
            </h1>
            <p className="text-sm text-slate-400">{this.state.message}</p>
            <Button
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/feed';
              }}
            >
              Reload feed
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
