import { initSentry } from './lib/sentry';
initSentry();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Sentry } from './lib/sentry';
import App from './App';
import './index.css';

function FallbackUI() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Something went wrong</h1>
        <p className="mt-2 text-gray-500">Please refresh the page or try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<FallbackUI />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
