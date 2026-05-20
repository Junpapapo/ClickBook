import React from "react";
import ReactDOM from "react-dom/client";
import Popup from "./Popup";
import { LanguageProvider } from "@/shared/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "../styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <Popup />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
