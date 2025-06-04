// src/components/admin/AdminLayout.tsx
import React from "react";
import { Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; //
import "../style/admin.css";
const AdminLayout: React.FC = () => {
  const auth = useAuth(); //
  const navigate = useNavigate();

  if (auth.isLoading) {
    return <div>Cargando autenticación...</div>;
  }

  if (!auth.isAuthenticated || !auth.isAdmin) {
    //
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    auth.logout(); //
    navigate("/");
  };

  return (
    <div
      className="admin-layout"
      style={{ display: "flex", minHeight: "100vh" }} // Using inline styles
    >
      <nav style={{ width: "250px", background: "#f0f0f0", padding: "20px" }}>
        <h3>Panel Admin</h3>
        <ul>
          <li>
            <Link to="/admin">Dashboard</Link> {/* */}
          </li>
          <li>
            <Link to="/admin/entradas">Gestionar Entradas</Link> {/* */}
          </li>
          <li>
            <Link to="/admin/mensajes">Gestionar Mensajes</Link> {/* */}
          </li>
        </ul>
        <button
          onClick={handleLogout}
          style={{ marginTop: "20px", padding: "8px 12px" }}
        >
          Cerrar Sesión
        </button>
      </nav>
      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet /> {/* */}
      </main>
    </div>
  );
};

export default AdminLayout;
