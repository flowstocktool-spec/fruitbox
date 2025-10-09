import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Register service worker for PWA (only in production)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.update();
        })
        .catch((registrationError) => {
          console.error('❌ Service Worker registration failed:', registrationError);
        });
    });
  } else {
    // Unregister service worker in development to prevent caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('🧹 Service Worker unregistered in development mode');
      }
    });
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);