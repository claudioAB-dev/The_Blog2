import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LanguageProvider } from "./features/LanguageContext"; //
import { AuthProvider } from "./context/AuthContext"; // NUEVA IMPORTACIÓN

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <AuthProvider>
        {" "}
        {/* ENVOLVEMOS CON AUTHPROVIDER */}
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </StrictMode>
  );
} else {
  console.error(
    "Failed to find the root element. Please check your HTML file."
  );
}
