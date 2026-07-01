// VERIFIED: components/ErrorBoundary.jsx — no issues found
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 select-none animate-fadeIn">
          <span className="text-6xl mb-4" role="img" aria-label="crashed">
            😵
          </span>
          <h2 className="text-white text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-[#A0A0C0] text-sm max-w-md mb-6 font-mono leading-relaxed break-words">
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/95 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-lg text-sm"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="bg-[#2A2A3E] hover:bg-[#3A3A5E] text-[#A0A0C0] hover:text-white font-semibold px-5 py-2.5 rounded-xl border border-[#3A3A5E] transition text-sm"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
