// src/components/admin/AdminLayout.tsx
import React from "react";
import { Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLayout: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) {
    return <div>Cargando autenticación...</div>; // O un spinner
  }

  if (!auth.isAuthenticated || !auth.isAdmin) {
    // Redirige a login, guardando la ubicación actual para volver después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    auth.logout();
    navigate("/"); // Redirigir a la home page después del logout
  };

  return (
    <div
      className="admin-layout"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <nav style={{ width: "250px", background: "#f0f0f0", padding: "20px" }}>
        <h3>Panel Admin</h3>
        <ul>
          <li>
            <Link to="/admin">Dashboard</Link>
          </li>
          <li>
            <Link to="/admin/entradas">Gestionar Entradas</Link>
          </li>
          <li>
            <Link to="/admin/mensajes">Gestionar Mensajes</Link>
          </li>
          {/* Agrega más enlaces según necesites */}
        </ul>
        <button
          onClick={handleLogout}
          style={{ marginTop: "20px", padding: "8px 12px" }}
        >
          Cerrar Sesión
        </button>
      </nav>
      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet /> {/* Aquí se renderizarán las páginas hijas del admin */}
      </main>
    </div>
  );
};

export default AdminLayout;
