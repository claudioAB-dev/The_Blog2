// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo, // Importado para memoizar el valor del contexto
} from "react";
import type { ReactNode } from "react";

interface AuthUser {
  id: number;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (newToken: string, userData: AuthUser) => void;
  logout: () => void;
  isLoading: boolean; // Mantenemos isLoading para la carga inicial del token
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  // isLoading se refiere a la carga inicial del token desde localStorage
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, intentar recuperar el token y usuario de localStorage
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUserString = localStorage.getItem("authUser");

      if (storedToken && storedUserString) {
        const storedUser = JSON.parse(storedUserString) as AuthUser;
        // Validar que el usuario almacenado tenga la estructura esperada
        if (
          storedUser &&
          typeof storedUser.id === "number" &&
          typeof storedUser.is_admin === "boolean"
        ) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // Si los datos del usuario no son válidos, limpiar localStorage
          console.warn("Stored user data is invalid. Clearing auth storage.");
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
        }
      }
    } catch (error) {
      // Si hay un error al parsear (ej. JSON malformado), limpiar localStorage
      console.error("Error parsing stored auth data:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } finally {
      setIsLoading(false); // Finaliza la carga independientemente del resultado
    }
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    // Podrías querer redirigir al usuario a la página de login aquí
    // usando useNavigate, pero eso usualmente se maneja en el componente que llama a logout.
  };

  // Memoizar estos valores para optimizar el rendimiento,
  // evitando re-renders innecesarios en los consumidores si el token o el usuario no han cambiado realmente.
  const isAuthenticated = useMemo(() => !!token, [token]);
  const isAdmin = useMemo(() => !!user?.is_admin, [user]);

  // Memoizar el valor del contexto para evitar re-renders innecesarios de los consumidores
  // si las props del Provider no cambian.
  const contextValue = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      isLoading,
    }),
    [token, user, isAuthenticated, isAdmin, isLoading]
  ); // login y logout son estables por definición de useState

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
