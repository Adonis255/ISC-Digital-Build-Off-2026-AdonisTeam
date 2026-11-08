import React from 'react'
import AppRoutes from './routes.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
            <p className="text-slate-600 mb-4">The app encountered an error instead of refreshing. Please take a screenshot of this message:</p>
            <pre className="bg-slate-800 text-slate-200 p-4 rounded-lg text-sm overflow-auto max-h-60">
              {this.state.error?.toString()}
            </pre>
            <button onClick={() => window.location.href = '/'} className="mt-6 bg-brand-600 text-white px-6 py-2 rounded-lg">Go to Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() { 
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}