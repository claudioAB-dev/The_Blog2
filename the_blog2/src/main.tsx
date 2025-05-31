import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Asegúrate de tener este archivo CSS o elimínalo si no es necesario
import App from "./App"; // Importamos el componente App
import { LanguageProvider } from "./features/LanguageContext"; // Asumo que tienes este archivo

// Obtén el elemento raíz del DOM
const rootElement = document.getElementById("root");

// Asegúrate de que el elemento raíz exista antes de continuar
if (rootElement) {
  // Crea la raíz de React
  const root = createRoot(rootElement);

  // Renderiza la aplicación
  root.render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>
  );
} else {
  console.error(
    "Failed to find the root element. Please check your HTML file."
  );
}
