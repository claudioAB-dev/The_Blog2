// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import EntradasNuevas from "./components/EntradasNuevas";
import EntradaDetalle from "./components/EntradaDetalle";

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
