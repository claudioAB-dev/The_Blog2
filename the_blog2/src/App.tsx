import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // <--- IMPORTANTE
import Navbar from "./widgets/Navbar";
import EntradasNuevas from "./widgets/EntradasNuevas";

function App() {
  return (
    <Router>
      {" "}
      {}
      <div className="App">
        <Navbar /> {}
        <main>
          <Routes>
            {" "}
            {/* <--- 2. Define el área donde tus rutas cambiarán */}
            {/* 3. Define una ruta para tu componente de entradas */}
            {/* Ajusta la ruta "/blog" a lo que prefieras */}
            <Route path="/" element={<EntradasNuevas />} />
            {/* Si tienes una página de inicio diferente, podrías tener algo como:
              <Route path="/" element={<PaginaDeInicio />} />
            */}
            {/* Y una ruta para ver una entrada individual (el :slug es un parámetro):
              Necesitarás un componente para mostrar la entrada individual, por ejemplo "EntradaDetalle"
              <Route path="/blog/:slug" element={<EntradaDetalle />} /> 
            */}
            {/* Puedes agregar más rutas aquí */}
          </Routes>
        </main>
        {/* Aquí podrías tener un Footer, etc. */}
      </div>
    </Router>
  );
}

export default App;
