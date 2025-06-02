// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./widgets/Navbar";
import EntradasNuevas from "./widgets/EntradasNuevas";
import EntradaDetalle from "./widgets/EntradaDetalle"; // <--- 1. IMPORTA EL COMPONENTE

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<EntradasNuevas />} />
            {/* 2. AÑADE LA RUTA PARA ENTRADA DETALLE */}
            <Route path="/blog/:slug" element={<EntradaDetalle />} />
            {/* Puedes cambiar "/blog/:slug" a la ruta que prefieras, ej. "/entradas/:slug" */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
