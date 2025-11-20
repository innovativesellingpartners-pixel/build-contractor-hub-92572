import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(registration => {
        console.log("Service worker registered:", registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available, will reload on next visit');
              }
            });
          }
        });
      })
      .catch(err => {
        console.error("Service worker registration failed", err);
      });
  });
}

// Ensure localStorage is accessible (critical for auth persistence)
try {
  const testKey = '__ct1_storage_test__';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
  console.log('localStorage is accessible');
} catch (e) {
  console.error('localStorage is not accessible:', e);
  alert('CT1 requires storage access to function properly. Please enable storage in your browser settings.');
}

// Trigger rebuild for types regeneration
createRoot(document.getElementById("root")!).render(<App />);
