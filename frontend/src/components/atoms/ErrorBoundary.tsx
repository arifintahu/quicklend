'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#FF4B4B]/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-[#FF4B4B] text-3xl">!</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-2">Your funds are safe.</p>
            <p className="text-sm text-gray-500 mb-6">
              An unexpected error occurred in the interface. Your on-chain positions are unaffected.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
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
