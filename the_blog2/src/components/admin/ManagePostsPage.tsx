// src/components/admin/ManagePostsPage.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
// Asumiendo que tienes una interfaz para tus posts/entradas
interface Post {
  id: number;
  titulo_es: string; //
  slug: string;
  estado: string; //
  fecha_publicacion?: string;
  // ... otros campos que quieras mostrar
}

const ManagePostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Para enviar en las peticiones

  useEffect(() => {
    const fetchPosts = async () => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://127.0.0.1:5000/admin/entradas", {
          // Endpoint que creaste
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Error al obtener las entradas");
        }
        const data = await response.json();
        setPosts(data.entradas || []); // Asumiendo que tu endpoint devuelve un objeto con una clave 'entradas'
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  // Lógica para crear, editar, eliminar posts...
  const handleCreatePost = () => {
    console.log(
      "Crear nuevo post..."
    ); /* Redirigir a formulario o abrir modal */
  };
  const handleEditPost = (postId: number) => {
    console.log(`Editar post ${postId}`);
  };
  const handleDeletePost = async (postId: number) => {
    if (
      !token ||
      !window.confirm("¿Estás seguro de que quieres eliminar esta entrada?")
    )
      return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/admin/entradas/${postId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la entrada");
      }
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      alert("Entrada eliminada exitosamente.");
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  if (isLoading) return <p>Cargando entradas...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Gestionar Entradas</h2>
      <button
        onClick={handleCreatePost}
        style={{ marginBottom: "20px", padding: "10px" }}
      >
        Crear Nueva Entrada
      </button>
      {posts.length === 0 ? (
        <p>No hay entradas para mostrar.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>ID</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Título (ES)
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Slug</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Estado
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {post.id}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {post.titulo_es}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {post.slug}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {post.estado}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <button
                    onClick={() => handleEditPost(post.id)}
                    style={{ marginRight: "5px" }}
                  >
                    Editar
                  </button>
                  <button onClick={() => handleDeletePost(post.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManagePostsPage;
