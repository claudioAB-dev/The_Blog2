import React from "react";
import Navbar from "./widgets/Navbar"; // Asumo que tienes este componente Navbar
// import './App.css'; // Opcional: si tienes estilos específicos para App

function App() {
  return (
    <div className="App">
      <Navbar />
      {/* Aquí puedes agregar más componentes, rutas, etc. */}
      <main>
        {/* El contenido principal de tu aplicación podría ir aquí */}
      </main>
    </div>
  );
}

export default App;
