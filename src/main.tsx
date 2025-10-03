import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Trigger rebuild for types regeneration
createRoot(document.getElementById("root")!).render(<App />);
