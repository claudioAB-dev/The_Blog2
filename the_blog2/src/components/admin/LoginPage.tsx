import React, { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; //
import "../style/admin.css";
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth(); //
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/admin";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Usa la URL completa de tu API
      const response = await fetch("http://127.0.0.1:5000/login", {
        //
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contrasena: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error al iniciar sesión.");
      }

      if (!data.access_token || typeof data.is_admin === "undefined") {
        //
        throw new Error("Respuesta inválida del servidor.");
      }

      if (!data.is_admin) {
        //
        throw new Error("Acceso denegado. Se requiere ser administrador.");
      }

      auth.login(data.access_token, {
        //
        id: data.user_id,
        email,
        is_admin: data.is_admin,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Ocurrió un error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        // Using inline styles as admin.css was not provided
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          style={{ padding: "10px 15px", cursor: "pointer" }}
        >
          {isLoading ? "Iniciando..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
