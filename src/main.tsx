import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(err => {
        console.error("Service worker registration failed", err);
      });
  });
}

// Trigger rebuild for types regeneration
createRoot(document.getElementById("root")!).render(<App />);
