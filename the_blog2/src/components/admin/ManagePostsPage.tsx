import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Post {
  id: number;
  autor_id: number;
  categoria_id: number;
  titulo_es: string;
  slug: string;
  resumen_es: string;
  contenido_es: string;
  imagen_destacada: string | null;
  estado: "borrador" | "publicado";
  fecha_publicacion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  titulo_en: string;
  titulo_de: string;
  resumen_en: string;
  resumen_de: string;
  contenido_en: string;
  contenido_de: string;
  comentarios: string[];
}

interface ApiResponse {
  entradas: Post[];
  total_pages: number;
  current_page: number;
  total_items: number;
}

const API_BASE_URL = "http://127.0.0.1:5000"; // Considera mover esto a variables de entorno
const ITEMS_PER_PAGE = 10; // Coincide con el per_page por defecto del backend o el que desees usar

const ManagePostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = useCallback(
    async (page: number, currentSearchTerm: string = "") => {
      if (!token) {
        setPosts([]);
        setTotalItems(0);
        setTotalPages(0);
        setCurrentPage(1);
        return;
      }
      setIsLoading(true);
      setError(null);

      let url = `${API_BASE_URL}/admin/entradas`;
      if (currentSearchTerm) {
        url += `&q=${encodeURIComponent(currentSearchTerm)}`;
      }

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorData = {
            message: `Error ${response.status}: ${response.statusText}`,
          };
          try {
            const parsedError = await response.json();
            errorData.message =
              parsedError.message || parsedError.error || errorData.message;
          } catch (e) {
            // Mantener el mensaje de error HTTP si el cuerpo no es JSON
          }
          throw new Error(errorData.message);
        }

        const data: ApiResponse = await response.json();
        setPosts(data.entradas || []);
        setTotalItems(data.total_items || 0);
        setTotalPages(data.total_pages || 0);
        setCurrentPage(data.current_page || 1);
      } catch (err: any) {
        setError(err.message);
        setPosts([]);
        setTotalItems(0);
        setTotalPages(0);
        // Opcional: resetear currentPage a 1 en caso de error de carga
        // setCurrentPage(1);
      } finally {
        setIsLoading(false);
      }
    },
    [token] // No es necesario currentPage aquí, se pasa como argumento
  );

  useEffect(() => {
    if (token) {
      // Cuando el término de búsqueda cambia, reseteamos a la página 1
      // y luego llamamos a fetchPosts.
      // Si solo cambia currentPage, fetchPosts se llama directamente.
      fetchPosts(currentPage, searchTerm);
    } else {
      setPosts([]);
      setTotalItems(0);
      setTotalPages(0);
      setCurrentPage(1);
      setError(null);
    }
  }, [fetchPosts, currentPage, searchTerm, token]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Resetear a la página 1 en nueva búsqueda
    // fetchPosts(1, newSearchTerm); // fetchPosts se llamará por el useEffect debido al cambio en searchTerm y currentPage
  };

  // Efecto para la búsqueda con "debouncing" (opcional pero recomendado)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (token) {
        // Solo buscar si hay token
        // No necesitamos llamar a fetchPosts aquí directamente si
        // el useEffect principal ya depende de searchTerm y currentPage.
        // El cambio en searchTerm (y el reseteo de currentPage en handleSearchChange)
        // ya disparará el efecto principal.
        // Sin embargo, si quieres que la búsqueda se active DESPUÉS del debounce
        // y NO en cada tecleo, necesitarías ajustar la lógica.
        // Para un debounce simple que actualiza la UI y luego el efecto principal
        // se encarga de fetchear, el setup actual es suficiente.
      }
    }, 500); // Retraso de 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, token]); // No incluir fetchPosts aquí para evitar bucles si fetchPosts cambia frecuentemente

  const handleCreatePost = () => {
    navigate("/admin/entradas/nueva");
  };

  const handleEditPost = (postId: number) => {
    navigate(`/admin/entradas/editar/${postId}`);
  };

  const handleDeletePost = async (postId: number) => {
    if (
      !token ||
      !window.confirm("¿Estás seguro de que quieres eliminar esta entrada?")
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/entradas/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorData = { message: "Error al eliminar la entrada." };
        try {
          const parsedError = await response.json();
          errorData.message =
            parsedError.message || parsedError.error || errorData.message;
        } catch (e) {
          // Mantener mensaje genérico
        }
        throw new Error(errorData.message);
      }
      // Refrescar la lista en la página actual después de eliminar.
      // Si la página actual queda vacía después de eliminar el último ítem,
      // podrías querer ir a la página anterior.
      fetchPosts(currentPage, searchTerm);
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!token && !isLoading) {
    return <p>Por favor, inicia sesión para administrar las entradas.</p>;
  }

  if (isLoading) return <p>Cargando entradas...</p>;
  // No mostrar error de "no hay token" si ya se mostró el mensaje de "inicia sesión"
  if (error && token) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Gestionar Entradas</h2>
      <div
        style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}
      >
        <input
          type="text"
          placeholder="Buscar por título, slug..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            padding: "10px",
            marginRight: "10px",
            minWidth: "300px",
            flexGrow: 1,
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>
      <button
        onClick={handleCreatePost}
        style={{
          marginBottom: "20px",
          padding: "10px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Crear Nueva Entrada
      </button>

      {posts.length === 0 && !isLoading ? ( // Añadido !isLoading para no mostrar "No hay entradas" mientras carga
        <p>
          No hay entradas para mostrar
          {searchTerm ? ` con el término "${searchTerm}"` : ""}.
        </p>
      ) : (
        <>
          <p style={{ marginBottom: "10px" }}>
            Mostrando {posts.length} de {totalItems} entradas.
            {totalPages > 0 && ` Página ${currentPage} de ${totalPages}`}
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th
                  style={{
                    border: "1px solid #dee2e6",
                    padding: "12px",
                    textAlign: "left",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    border: "1px solid #dee2e6",
                    padding: "12px",
                    textAlign: "left",
                  }}
                >
                  Título (ES)
                </th>
                <th
                  style={{
                    border: "1px solid #dee2e6",
                    padding: "12px",
                    textAlign: "left",
                  }}
                >
                  Slug
                </th>
                <th
                  style={{
                    border: "1px solid #dee2e6",
                    padding: "12px",
                    textAlign: "left",
                  }}
                >
                  Estado
                </th>
                <th
                  style={{
                    border: "1px solid #dee2e6",
                    padding: "12px",
                    textAlign: "left",
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                    {post.id}
                  </td>
                  <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                    {post.titulo_es}
                  </td>
                  <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                    {post.slug}
                  </td>
                  <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                    {post.estado}
                  </td>
                  <td style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                    <button
                      onClick={() => handleEditPost(post.id)}
                      style={{
                        marginRight: "8px",
                        padding: "6px 10px",
                        backgroundColor: "#ffc107",
                        color: "black",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                style={{ marginLeft: "10px", padding: "8px 12px" }}
              >
                Anterior
              </button>
              <span style={{ margin: "0 15px" }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                style={{ marginLeft: "5px", padding: "8px 12px" }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagePostsPage;
