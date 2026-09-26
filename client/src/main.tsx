import { createRoot } from "react-dom/client";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[ServiceWorker] Registration unavailable; offline support is disabled.", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<>
  <App />
  <Analytics />
</>);
