import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../features/LanguageContext"; // Ruta actualizada
import type { LanguageCode } from "../features/LanguageContext"; // Ruta actualizada
import "./EntradaDetalle.css"; // Asegúrate que la ruta sea correcta o crea el archivo

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
}

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

const DetailTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  authorLabel: { ES: "Autor ID", EN: "Author ID", DE: "Autor ID" },
  categoryLabel: { ES: "Categoría ID", EN: "Category ID", DE: "Kategorie ID" },
  publishedDateLabel: {
    ES: "Publicado el",
    EN: "Published on",
    DE: "Veröffentlicht am",
  },
  loadingMessage: {
    ES: "Cargando entrada... ⏳",
    EN: "Loading entry... ⏳",
    DE: "Eintrag wird geladen... ⏳",
  },
  errorMessagePrefix: { ES: "Error", EN: "Error", DE: "Fehler" },
  notFoundMessage: {
    ES: "La entrada solicitada no fue encontrada o no hay datos disponibles. 🤷‍♂️",
    EN: "The requested entry was not found or no data is available. 🤷‍♂️",
    DE: "Der angeforderte Eintrag wurde nicht gefunden oder es sind keine Daten verfügbar. 🤷‍♂️",
  },
};

const getDetailTranslation = (key: string, lang: LanguageCode): string => {
  return (
    DetailTranslations[key]?.[lang] || DetailTranslations[key]?.["ES"] || key
  );
};

const EntradaDetalle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentLanguage } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:5000/entradas";

  useEffect(() => {
    if (!slug) {
      setError("No se proporcionó un slug para la entrada.");
      setCargando(false);
      return;
    }

    const fetchPostData = async () => {
      setCargando(true);
      setError(null);
      setPost(null);
      try {
        const response = await fetch(`${API_BASE_URL}?slug=${slug}`);
        let jsonResponse;
        try {
          jsonResponse = await response.json();
        } catch (parseError) {
          if (!response.ok) {
            throw new Error(
              `Error HTTP: ${response.status} - Respuesta no es JSON válido.`
            );
          }
          throw new Error("Respuesta exitosa pero no se pudo parsear el JSON.");
        }

        if (!response.ok) {
          if (response.status === 404) {
            const message =
              jsonResponse?.message ||
              `Entrada con slug "${slug}" no encontrada (Error 404).`;
            throw new Error(message);
          }
          const errorText =
            jsonResponse?.error ||
            jsonResponse?.message ||
            `Error HTTP: ${response.status} - No se pudo cargar la entrada.`;
          throw new Error(errorText);
        }

        if (!jsonResponse || typeof jsonResponse.slug === "undefined") {
          throw new Error(
            `La respuesta del servidor para el slug "${slug}" no contiene los datos esperados de la entrada.`
          );
        }
        setPost(jsonResponse as BlogPost);
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Ocurrió un error desconocido al cargar la entrada.";
        setError(errorMessage);
        console.error("Error al cargar la entrada:", e);
        setPost(null);
      } finally {
        setCargando(false);
      }
    };

    fetchPostData();
  }, [slug]);

  const pageTitle = useMemo(() => {
    if (cargando)
      return getDetailTranslation("loadingMessage", currentLanguage)
        .replace("⏳", "")
        .trim();
    if (error)
      return getDetailTranslation("errorMessagePrefix", currentLanguage);
    if (!post) return getDetailTranslation("notFoundMessage", currentLanguage);
    return getPostTranslatedField(post, "titulo", currentLanguage);
  }, [post, currentLanguage, cargando, error]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const fechaPublicacionFormateada = useMemo(() => {
    if (!post || !post.fecha_publicacion) {
      return "Fecha desconocida";
    }
    try {
      let langForLocale = currentLanguage.toLowerCase();
      // Adaptar códigos de idioma si es necesario para toLocaleDateString
      if (langForLocale === "en") langForLocale = "en-US";
      if (langForLocale === "es") langForLocale = "es-ES";
      if (langForLocale === "de") langForLocale = "de-DE";

      return new Date(post.fecha_publicacion).toLocaleDateString(
        langForLocale,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          // Comentado para evitar problemas si la fecha no tiene hora o es medianoche UTC
          // hour: "2-digit",
          // minute: "2-digit",
        }
      );
    } catch (e) {
      console.error(
        "Error al formatear la fecha:",
        e,
        "Idioma actual:",
        currentLanguage,
        "Fecha original:",
        post.fecha_publicacion
      );
      // Fallback a un formato simple si `toLocaleDateString` falla
      const date = new Date(post.fecha_publicacion);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    }
  }, [post, currentLanguage]);

  if (cargando) {
    return (
      <div className="entrada-detalle-status">
        {getDetailTranslation("loadingMessage", currentLanguage)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="entrada-detalle-status entrada-detalle-error">
        {getDetailTranslation("errorMessagePrefix", currentLanguage)}: {error}{" "}
        😞
      </div>
    );
  }

  if (!post) {
    return (
      <div className="entrada-detalle-status">
        {getDetailTranslation("notFoundMessage", currentLanguage)}
      </div>
    );
  }

  const titulo = getPostTranslatedField(post, "titulo", currentLanguage);
  const contenido = getPostTranslatedField(post, "contenido", currentLanguage);

  return (
    <div className="entrada-detalle-container">
      <article className="entrada-detalle-contenido">
        <header className="entrada-detalle-header">
          <h1 className="entrada-detalle-titulo">{titulo}</h1>
          {post.imagen_destacada && (
            <img
              src={post.imagen_destacada}
              alt={`Imagen destacada para ${titulo}`}
              className="entrada-detalle-imagen"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="entrada-detalle-meta">
            <p className="meta-item">
              <span className="meta-label">
                {getDetailTranslation("publishedDateLabel", currentLanguage)}:
              </span>{" "}
              <time dateTime={post.fecha_publicacion}>
                {fechaPublicacionFormateada}
              </time>
            </p>
            {/* Podrías añadir aquí el nombre del autor si lo recuperas */}
            {/* <p className="meta-item">
              <span className="meta-label">
                {getDetailTranslation("authorLabel", currentLanguage)}:
              </span>{" "}
              {post.autor_id} // Reemplazar con nombre del autor
            </p> */}
          </div>
        </header>
        <div
          className="entrada-detalle-cuerpo"
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      </article>
    </div>
  );
};

export default EntradaDetalle;
