import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/seo.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register Service Worker for performance caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      if (import.meta.env.DEV) {
        console.log('ServiceWorker registered successfully:', registration.scope);
      }
      
      // Update available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (import.meta.env.DEV) {
              console.log('New service worker available, consider refreshing');
            }
          }
        });
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('ServiceWorker registration failed:', error);
      }
    }
  });
}
