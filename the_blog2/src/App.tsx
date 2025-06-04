import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import EntradasNuevas from "./components/EntradasNuevas";
import EntradaDetalle from "./components/EntradaDetalle";

// Nuevas importaciones para el Admin
import LoginPage from "./components/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./components/admin/DashboardPage";
import ManagePostsPage from "./components/admin/ManagePostsPage";
import PostsPorCategoria from "./components/PostsPorCategoria";
// Asegúrate de crear este componente

function App() {
  return (
    <Router>
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
          <Route
            path="/category/:categoria"
            element={
              <>
                <Navbar />
                <main>
                  <PostsPorCategoria />
                </main>
              </>
            }
          />
          {/* Ruta de Login para Admin */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas del Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="entradas" element={<ManagePostsPage />} />
            {/* <--- RUTA DESCOMENTADA */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
