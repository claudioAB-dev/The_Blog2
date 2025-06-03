import React, { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../features/LanguageContext"; // Ajusta la ruta si es necesario
import type { LanguageCode } from "../features/LanguageContext"; // Ajusta la ruta si es necesario
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import "./style/Entradas.css"; // Asegúrate de que este archivo CSS esté actualizado
import IconButton from "@mui/material/IconButton";

// --- Definición de Traducciones Estáticas de la Página ---
const BlogTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  noEntriesMessage: {
    ES: "No hay entradas disponibles en este momento.",
    EN: "No entries available at this time.",
    DE: "Derzeit sind keine Einträge verfügbar.",
  },
  loadingMessage: {
    ES: "Cargando entradas...",
    EN: "Loading entries...",
    DE: "Lade Einträge...",
  },
  readMore: { ES: "Leer más", EN: "Read more", DE: "Weiterlesen" },
  loadingAuthor: {
    ES: "Cargando autor...",
    EN: "Loading author...",
    DE: "Autor wird geladen...",
  },
  defaultAuthor: { ES: "Redacción", EN: "Editorial Team", DE: "Redaktion" },
  topStoriesTitle: {
    ES: "Historias Destacadas",
    EN: "Top Stories",
    DE: "Top-Geschichten",
  },
  aboutMeTitle: { ES: "Sobre Mí", EN: "About Me", DE: "Über Mich" },
  aboutMeContentPlaceholder: {
    ES: "Aquí va una breve descripción sobre mí.",
    EN: "A brief description about me will go here.",
    DE: "Hier kommt eine kurze Beschreibung über mich.",
  },
  aboutMeSoftwareDev: {
    ES: "Como desarrollador full stack, me especializo en la creación de soluciones tecnológicas completas e innovadoras. Mi pasión radica en transformar ideas complejas en aplicaciones funcionales, escalables y robustas que generen un impacto real. Con una mentalidad de aprendizaje continuo, me mantengo actualizado con las últimas tendencias y tecnologías, enfrentando nuevos desafíos técnicos que me permitan expandir mis habilidades y explorar diferentes stacks tecnológicos.",

    EN: "As a full stack developer, I specialize in creating comprehensive and innovative technological solutions. My passion lies in transforming complex ideas into functional, scalable, and robust applications that generate real impact. With a continuous learning mindset, I stay updated with the latest trends and technologies, embracing new technical challenges that allow me to expand my skills and explore different technology stacks. ",

    DE: "Als Full-Stack-Entwickler spezialisiere ich mich auf die Erstellung umfassender und innovativer technologischer Lösungen. Meine Leidenschaft liegt darin, komplexe Ideen in funktionale, skalierbare und robuste Anwendungen zu verwandeln, die echte Wirkung erzielen. Mit einer kontinuierlichen Lernmentalität halte ich mich über die neuesten Trends und Technologien auf dem Laufenden und nehme neue technische Herausforderungen.",
  },
  allPostsTitle: {
    ES: "Todas las Publicaciones",
    EN: "All Posts",
    DE: "Alle Beiträge",
  },
};

// --- Función de Traducción (Estática) ---
const getTranslation = (
  key: string,
  lang: LanguageCode,
  interpolations?: Record<string, string | number>
): string => {
  const translationTemplate =
    BlogTranslations[key]?.[lang] || BlogTranslations[key]?.["ES"] || key;
  if (interpolations) {
    let result = translationTemplate;
    for (const placeholder in interpolations) {
      result = result.replace(
        new RegExp(`{${placeholder}}`, "g"),
        String(interpolations[placeholder])
      );
    }
    return result;
  }
  return translationTemplate;
};

// --- Interfaces ---
interface BlogPost {
  id: number;
  autor_id: number;
  categoria_id: number;
  slug: string;
  imagen_destacada: string;
  estado: string;
  fecha_publicacion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  titulo_es: string;
  resumen_es: string;
  contenido_es: string;
  titulo_en?: string;
  resumen_en?: string;
  contenido_en?: string;
  titulo_de?: string;
  resumen_de?: string;
  contenido_de?: string;
  nombre_autor?: string;
  tiempo_lectura_estimado_minutos?: number;
}
interface Author {
  id: number;
  nombre: string;
  email: string;
}
type ApiPostsResponse = BlogPost[];
type ApiAuthorsResponse = Author[];

// --- Helper para obtener el campo traducido de una entrada ---
const getPostTranslatedField = (
  post: BlogPost,
  fieldName: "titulo" | "resumen" | "contenido",
  lang: LanguageCode
): string => {
  const targetLangField =
    `${fieldName}_${lang.toLowerCase()}` as keyof BlogPost;
  const fallbackEsField = `${fieldName}_es` as keyof BlogPost;
  const fieldValue =
    (post[targetLangField] as string) || (post[fallbackEsField] as string);
  return fieldValue || `[${fieldName} no disponible en ${lang} o ES]`;
};

// --- Componente Entradas ---
const EntradasNuevas: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[] | null>(null);
  const [authors, setAuthors] = useState<Author[] | null>(null);
  const [cargandoPosts, setCargandoPosts] = useState<boolean>(true);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);

  const API_POSTS_URL = "http://127.0.0.1:5000/entradas";
  const API_AUTHORS_URL = "http://127.0.0.1:5000/autores";

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setCargandoPosts(true);
      setErrorPosts(null);
      try {
        const respuesta = await fetch(API_POSTS_URL);
        if (!respuesta.ok)
          throw new Error(
            `Error HTTP al cargar entradas: ${respuesta.status} ${respuesta.statusText}`
          );
        const json = (await respuesta.json()) as ApiPostsResponse;
        const sortedPosts = json.sort(
          (a, b) =>
            new Date(b.fecha_publicacion).getTime() -
            new Date(a.fecha_publicacion).getTime()
        );
        setAllBlogPosts(sortedPosts);
      } catch (e: unknown) {
        if (e instanceof Error) setErrorPosts(e.message);
        else
          setErrorPosts("Ocurrió un error desconocido al cargar las entradas.");
        setAllBlogPosts(null);
      } finally {
        setCargandoPosts(false);
      }
    };
    fetchData();
  }, [API_POSTS_URL]);

  useEffect(() => {
    const fetchAuthors = async (): Promise<void> => {
      try {
        const respuesta = await fetch(API_AUTHORS_URL);
        if (!respuesta.ok) {
          console.error(
            `Error HTTP al cargar autores: ${respuesta.status} ${respuesta.statusText}`
          );
          setAuthors([]);
          return;
        }
        const json = (await respuesta.json()) as ApiAuthorsResponse;
        setAuthors(json);
      } catch (e: unknown) {
        console.error("Ocurrió un error desconocido al cargar los autores.", e);
        setAuthors([]);
      }
    };
    fetchAuthors();
  }, [API_AUTHORS_URL]);

  const noEntriesMessageText = useMemo(
    () => getTranslation("noEntriesMessage", currentLanguage),
    [currentLanguage]
  );
  const loadingMessageText = useMemo(
    () => getTranslation("loadingMessage", currentLanguage),
    [currentLanguage]
  );
  const readMoreText = useMemo(
    () => getTranslation("readMore", currentLanguage),
    [currentLanguage]
  );
  const loadingAuthorText = useMemo(
    () => getTranslation("loadingAuthor", currentLanguage),
    [currentLanguage]
  );
  const defaultAuthorText = useMemo(
    () => getTranslation("defaultAuthor", currentLanguage),
    [currentLanguage]
  );
  const topStoriesTitleText = useMemo(
    () => getTranslation("topStoriesTitle", currentLanguage),
    [currentLanguage]
  );
  const aboutMeTitleText = useMemo(
    () => getTranslation("aboutMeTitle", currentLanguage),
    [currentLanguage]
  );
  const aboutMeContentPlaceholderText = useMemo(
    () => getTranslation("aboutMeContentPlaceholder", currentLanguage),
    [currentLanguage]
  );
  const aboutMeSoftwareDevText = useMemo(
    () => getTranslation("aboutMeSoftwareDev", currentLanguage),
    [currentLanguage]
  );
  const allPostsTitleText = useMemo(
    () => getTranslation("allPostsTitle", currentLanguage),
    [currentLanguage]
  );

  const getAuthorName = (post: BlogPost): string => {
    if (authors === null) return loadingAuthorText;
    const author = authors.find((auth) => auth.id === post.autor_id);
    return author ? author.nombre : defaultAuthorText;
  };

  const formatDate = (dateString: string) => {
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
    } catch (e) {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    }
  };

  if (cargandoPosts)
    return <div className="entradas-status-loading">{loadingMessageText}</div>;
  if (errorPosts)
    return (
      <div className="entradas-status-error">
        Error al cargar las entradas: {errorPosts}
      </div>
    );
  if (!allBlogPosts || allBlogPosts.length === 0)
    return (
      <div className="entradas-status-no-entries">{noEntriesMessageText}</div>
    );

  const latestPost = allBlogPosts[0];
  const topStoriesPosts =
    allBlogPosts.length > 1 ? allBlogPosts.slice(1, 4) : [];

  return (
    <div className="claudio-ariza-balseca-layout">
      <aside className="cab-sidebar-brand">
        <h1 className="cab-brand-title">Claudio Ariza Balseca</h1>
      </aside>

      <main className="cab-main-content">
        {/* Fila superior: Contiene la entrada destacada y la columna de la barra lateral */}
        <div className="cab-main-content-top-row">
          {/* Sección de la entrada más reciente */}
          {latestPost && (
            <section className="cab-featured-post">
              <Link
                to={`/blog/${latestPost.slug}`}
                className="cab-featured-post-link"
              >
                <div className="cab-featured-image-container">
                  {latestPost.imagen_destacada && (
                    <img
                      src={latestPost.imagen_destacada}
                      alt={getPostTranslatedField(
                        latestPost,
                        "titulo",
                        currentLanguage
                      )}
                      className="cab-featured-image"
                    />
                  )}
                </div>
                <div className="cab-featured-text-content">
                  <h2 className="cab-featured-title">
                    {getPostTranslatedField(
                      latestPost,
                      "titulo",
                      currentLanguage
                    )}
                  </h2>
                  <p className="cab-featured-summary">
                    {getPostTranslatedField(
                      latestPost,
                      "resumen",
                      currentLanguage
                    )}
                  </p>
                  <div className="cab-featured-meta">
                    <span className="cab-author-name">
                      {getAuthorName(latestPost)}
                    </span>
                    <span className="cab-publication-date">
                      {formatDate(latestPost.fecha_publicacion)}
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Columna para la Barra Lateral (Top Stories + About Me) */}
          <div className="cab-sidebar-column">
            {/* Sección "Top Stories" */}
            {topStoriesPosts.length > 0 && (
              <aside className="cab-top-stories">
                <h3 className="cab-section-title">{topStoriesTitleText}</h3>
                <ul className="cab-top-stories-list">
                  {topStoriesPosts.map((post, index) => {
                    const titulo = getPostTranslatedField(
                      post,
                      "titulo",
                      currentLanguage
                    );
                    return (
                      <li key={post.id} className="cab-top-story-item">
                        <Link
                          to={`/blog/${post.slug}`}
                          className="cab-top-story-link"
                        >
                          <div className="cab-top-story-text">
                            <span className="cab-top-story-number">
                              {index + 1}
                            </span>
                            <div className="cab-top-story-title-container">
                              {" "}
                              {/* Contenedor para título y meta */}
                              <h4 className="cab-top-story-title">{titulo}</h4>
                              <div className="cab-top-story-meta">
                                <span className="cab-author-name-small">
                                  {getAuthorName(post)}
                                </span>
                                <span className="cab-publication-date-small">
                                  {/* El CSS añadirá "•" con ::before a esta clase */}
                                  {formatDate(post.fecha_publicacion)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {post.imagen_destacada && (
                            <img
                              src={post.imagen_destacada}
                              alt={titulo}
                              className="cab-top-story-image"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}

            {/* Sección "Sobre Mí" */}
            <aside className="cab-about-me">
              <h3 className="cab-section-title">{aboutMeTitleText}</h3>
              <div className="cab-about-me-content">
                <p>{getTranslation("aboutMeSoftwareDev", currentLanguage)}</p>

                {/* NUEVO: Enlaces a perfiles con Iconos de Material-UI */}
                <div className="cab-social-links">
                  <IconButton
                    aria-label="LinkedIn Profile"
                    href="https://www.linkedin.com/in/claudio-ariza-balseca-865853226/"
                    target="_blank"
                    rel="noopener noreferrer"
                    // Puedes añadir estilos directamente con la prop `sx` o usando tus clases CSS
                    // sx={{ color: 'yourDesiredColor' }} // Ejemplo de estilo en línea
                    className="cab-social-icon" // Puedes usar una clase común o específica si necesitas más estilos
                  >
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton
                    aria-label="GitHub Profile"
                    href="https://github.com/claudioAB-dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    // sx={{ color: 'yourDesiredColor' }} // Ejemplo de estilo en línea
                    className="cab-social-icon" // Puedes usar una clase común o específica
                  >
                    <GitHubIcon />
                  </IconButton>
                </div>
              </div>
            </aside>
          </div>
        </div>{" "}
        {/* Fin de .cab-main-content-top-row */}
        {/* Sección "Todas las Publicaciones" */}
        {allBlogPosts && allBlogPosts.length > 0 && (
          <section className="cab-all-posts">
            <h2 className="cab-section-title-full-width">
              {allPostsTitleText}
            </h2>
            <div className="cab-all-posts-grid">
              {allBlogPosts.map((post) => (
                <article key={post.id} className="cab-post-card">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="cab-post-card-link"
                  >
                    {post.imagen_destacada && (
                      <div className="cab-post-card-image-container">
                        <img
                          src={post.imagen_destacada}
                          alt={getPostTranslatedField(
                            post,
                            "titulo",
                            currentLanguage
                          )}
                          className="cab-post-card-image"
                        />
                      </div>
                    )}
                    <div className="cab-post-card-content">
                      <h4 className="cab-post-card-title">
                        {getPostTranslatedField(
                          post,
                          "titulo",
                          currentLanguage
                        )}
                      </h4>
                      <p className="cab-post-card-summary">
                        {getPostTranslatedField(
                          post,
                          "resumen",
                          currentLanguage
                        ).substring(0, 120) + "..."}
                      </p>
                      <div className="cab-post-card-meta">
                        <span className="cab-author-name-small">
                          {getAuthorName(post)}
                        </span>
                        <span className="cab-publication-date-small">
                          {formatDate(post.fecha_publicacion)}
                        </span>
                      </div>
                      <span className="cab-read-more-link">{readMoreText}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default EntradasNuevas;
