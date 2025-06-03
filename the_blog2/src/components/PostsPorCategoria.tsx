import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../features/LanguageContext";
import type { LanguageCode } from "../features/LanguageContext";
import "./style/PostsPorCategoria.css";

// --- Interfaces ---
interface Category {
  id: number;
  nombre_es: string;
  nombre_en: string;
  nombre_de: string;
  slug: string;
}

interface BlogPost {
  id: number;
  autor_id: number;
  categoria_id: number;
  slug: string;
  imagen_destacada: string;
  estado: string;
  fecha_publicacion: string;
  titulo_es: string;
  resumen_es: string;
  contenido_es: string;
  titulo_en?: string;
  resumen_en?: string;
  contenido_en?: string;
  titulo_de?: string;
  resumen_de?: string;
  contenido_de?: string;
}

interface Author {
  id: number;
  nombre: string;
}

// --- Translations ---
const PostsCategoryTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  pageTitle: {
    ES: "Entradas en: {categoryName}",
    EN: "Posts in: {categoryName}",
    DE: "Beiträge in: {categoryName}",
  },
  loadingMessage: {
    ES: "Cargando entradas...",
    EN: "Loading posts...",
    DE: "Lade Beiträge...",
  },
  noPostsMessage: {
    ES: "No hay entradas en esta categoría.",
    EN: "No posts found in this category.",
    DE: "Keine Beiträge in dieser Kategorie gefunden.",
  },
  errorMessage: {
    ES: "Error al cargar las entradas.",
    EN: "Error loading posts.",
    DE: "Fehler beim Laden der Beiträge.",
  },
  goBackCategories: {
    ES: "Ver todas las categorías",
    EN: "View all categories",
    DE: "Alle Kategorien anzeigen",
  },
  readMore: { ES: "Leer más", EN: "Read more", DE: "Weiterlesen" },
  loadingAuthor: {
    ES: "Cargando autor...",
    EN: "Loading author...",
    DE: "Autor wird geladen...",
  },
  defaultAuthor: { ES: "Redacción", EN: "Editorial Team", DE: "Redaktion" },
  categoriesText: {
    ES: "Categorías",
    EN: "Categories",
    DE: "Kategorien",
  },
  categoryNotFound: {
    ES: "Categoría no encontrada",
    EN: "Category not found",
    DE: "Kategorie nicht gefunden",
  },
};

const getLabel = (
  key: string,
  lang: LanguageCode,
  interpolations?: Record<string, string>
): string => {
  let text =
    PostsCategoryTranslations[key]?.[lang] ||
    PostsCategoryTranslations[key]?.["ES"] ||
    key;
  if (interpolations) {
    Object.keys(interpolations).forEach((placeholder) => {
      text = text.replace(
        new RegExp(`{${placeholder}}`, "g"),
        interpolations[placeholder]
      );
    });
  }
  return text;
};

// Helper to get translated post fields
const getPostTranslatedField = (
  post: BlogPost,
  fieldName: "titulo" | "resumen",
  lang: LanguageCode
): string => {
  const targetLangField =
    `${fieldName}_${lang.toLowerCase()}` as keyof BlogPost;
  const fallbackEsField = `${fieldName}_es` as keyof BlogPost;
  return (
    (post[targetLangField] as string) ||
    (post[fallbackEsField] as string) ||
    `[${fieldName} no disponible]`
  );
};

// Helper to get category name
const getCategoryNameTranslated = (
  category: Category,
  lang: LanguageCode
): string => {
  switch (lang) {
    case "EN":
      return category.nombre_en || category.nombre_es;
    case "DE":
      return category.nombre_de || category.nombre_es;
    case "ES":
    default:
      return category.nombre_es;
  }
};

const PostsPorCategoria: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentLanguage } = useLanguage();

  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    if (!slug) {
      setError("No category slug provided.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesRes, postsRes, authorsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categorias`),
          fetch(`${API_BASE_URL}/entradas`),
          fetch(`${API_BASE_URL}/autores`),
        ]);

        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
        if (!postsRes.ok) throw new Error("Failed to fetch posts");
        if (!authorsRes.ok) throw new Error("Failed to fetch authors");

        const allCategories: Category[] = await categoriesRes.json();
        const allPosts: BlogPost[] = await postsRes.json();
        const allAuthors: Author[] = await authorsRes.json();

        setAuthors(allAuthors);

        const foundCategory = allCategories.find((cat) => cat.slug === slug);
        if (!foundCategory) {
          setError(`Category with slug "${slug}" not found.`);
          setCurrentCategory(null);
          setFilteredPosts([]);
        } else {
          setCurrentCategory(foundCategory);
          const postsForCategory = allPosts.filter(
            (post) => post.categoria_id === foundCategory.id
          );
          setFilteredPosts(postsForCategory);
        }
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message);
        else setError("An unknown error occurred.");
        setFilteredPosts([]);
        setCurrentCategory(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, API_BASE_URL]);

  const getAuthorName = (autorId: number): string => {
    const author = authors.find((auth) => auth.id === autorId);
    return author ? author.nombre : getLabel("defaultAuthor", currentLanguage);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    let langCodeForDate = currentLanguage.toLowerCase();
    if (currentLanguage === "EN") langCodeForDate = "en-US";
    else if (currentLanguage === "ES") langCodeForDate = "es-ES";
    else if (currentLanguage === "DE") langCodeForDate = "de-DE";
    try {
      return new Date(dateString).toLocaleDateString(langCodeForDate, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString.split("T")[0];
    }
  };

  const categoryDisplayName = useMemo(() => {
    if (!currentCategory) return slug;
    return getCategoryNameTranslated(currentCategory, currentLanguage);
  }, [currentCategory, currentLanguage, slug]);

  const pageTitleText = useMemo(
    () =>
      getLabel("pageTitle", currentLanguage, {
        categoryName: categoryDisplayName || "",
      }),
    [currentLanguage, categoryDisplayName]
  );

  useEffect(() => {
    document.title = pageTitleText;
  }, [pageTitleText]);

  if (isLoading) {
    return (
      <div className="posts-por-categoria-container">
        <div className="posts-categoria-status">
          <div className="posts-categoria-loading">
            {getLabel("loadingMessage", currentLanguage)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="posts-por-categoria-container">
        <div className="posts-categoria-status">
          <div className="posts-categoria-error">
            {getLabel("errorMessage", currentLanguage)}: {error}
          </div>
          <Link to="/categories" className="posts-categoria-back-link">
            {getLabel("goBackCategories", currentLanguage)}
          </Link>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="posts-por-categoria-container">
        <div className="posts-categoria-status">
          <div className="posts-categoria-no-posts">
            {getLabel("categoryNotFound", currentLanguage)}
          </div>
          <Link to="/" className="posts-categoria-back-link">
            {getLabel("goBackCategories", currentLanguage)}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-por-categoria-container">
      {/* Breadcrumb navigation */}
      <nav className="posts-categoria-breadcrumb">
        <Link to="/">{getLabel("categoriesText", currentLanguage)}</Link>
        {" > "}
        <span>{categoryDisplayName}</span>
      </nav>

      {/* Page title */}
      <h1 className="posts-categoria-title">{pageTitleText}</h1>

      {/* Posts grid */}
      {filteredPosts.length === 0 ? (
        <div className="posts-categoria-status">
          <div className="posts-categoria-no-posts">
            {getLabel("noPostsMessage", currentLanguage)}
          </div>
        </div>
      ) : (
        <div className="posts-categoria-grid">
          {filteredPosts.map((post) => (
            <article key={post.id} className="posts-categoria-card">
              <Link
                to={`/blog/${post.slug}`}
                className="posts-categoria-card-link"
              >
                {post.imagen_destacada && (
                  <div className="posts-categoria-image-container">
                    <img
                      src={post.imagen_destacada}
                      alt={getPostTranslatedField(
                        post,
                        "titulo",
                        currentLanguage
                      )}
                      className="posts-categoria-image"
                    />
                  </div>
                )}
                <div className="posts-categoria-content">
                  <h2 className="posts-categoria-post-title">
                    {getPostTranslatedField(post, "titulo", currentLanguage)}
                  </h2>
                  <p className="posts-categoria-summary">
                    {getPostTranslatedField(
                      post,
                      "resumen",
                      currentLanguage
                    ).substring(0, 140)}
                    {getPostTranslatedField(post, "resumen", currentLanguage)
                      .length > 140
                      ? "..."
                      : ""}
                  </p>
                  <div className="posts-categoria-meta">
                    <div className="posts-categoria-author">
                      {getAuthorName(post.autor_id)}
                    </div>
                    <div className="posts-categoria-date">
                      {formatDate(post.fecha_publicacion)}
                    </div>
                  </div>
                  <span className="posts-categoria-read-more">
                    {getLabel("readMore", currentLanguage)}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Navigation back to categories */}
      <nav className="posts-categoria-navigation">
        <Link to="/" className="posts-categoria-back-link">
          {getLabel("goBackCategories", currentLanguage)}
        </Link>
      </nav>
    </div>
  );
};

export default PostsPorCategoria;
