import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "../styles/global.css";

// Check if we should use ClickBook as the new tab page.
// If the setting is disabled, redirect to Chrome's native new tab page immediately.
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get("clickbook_settings", (res) => {
    const useAsNewTab = res.clickbook_settings?.useClickBookAsNewTab !== false;
    if (!useAsNewTab) {
      window.location.replace("chrome://new-tab-page/");
    } else {
      render();
    }
  });
} else {
  render();
}

function render() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
