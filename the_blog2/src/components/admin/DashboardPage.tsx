import React from "react";
import { useAuth } from "../../context/AuthContext"; //
import "../style/admin.css";

const DashboardPage: React.FC = () => {
  const { user } = useAuth(); //
  return (
    <div>
      <h1>Bienvenido al Panel de Administración</h1>
      {user && <p>Has iniciado sesión como: {user.email}</p>} {/* */}
      <p>Desde aquí puedes gestionar el contenido de tu blog.</p>
    </div>
  );
};

export default DashboardPage;
