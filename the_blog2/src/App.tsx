// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; //
import EntradasNuevas from "./components/EntradasNuevas"; //
import EntradaDetalle from "./components/EntradaDetalle"; //

// Nuevas importaciones para el Admin
import LoginPage from "./components/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./components/admin/DashboardPage";
import ManagePostsPage from "./components/admin/ManagePostsPage";
// Importa aquí ManageMessagesPage cuando lo crees

function App() {
  return (
    <Router>
      {/* El Navbar principal podría ocultarse en las rutas /admin o tener uno diferente dentro de AdminLayout */}
      <div className="App">
        <Routes>
          {/* Rutas Públicas */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <main>
                  <EntradasNuevas />
                </main>
              </>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <>
                <Navbar />
                <main>
                  <EntradaDetalle />
                </main>
              </>
            }
          />
          {/* Puedes añadir más rutas públicas aquí como /portfolio, etc. envueltas con Navbar y main */}

          {/* Ruta de Login para Admin */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas del Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="entradas" element={<ManagePostsPage />} />
            {/* <Route path="mensajes" element={<ManageMessagesPage />} /> */}
            {/* ... más sub-rutas del admin */}
          </Route>

          {/* Ruta catch-all para 404 si es necesario */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
