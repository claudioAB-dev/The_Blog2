import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { useLanguage } from "../features/LanguageContext";
import type { LanguageCode } from "../features/LanguageContext";

// Some logos heare

// translation
interface Category {
  id: number;
  nombre_es: string;
  nombre_en: string;
  nombre_de: string;
  slug: string;
}
interface ApiResponse extends Array<Category> {}

const getCategoryNameByLanguage = (
  category: Category,
  language: LanguageCode
): string => {
  switch (language) {
    case "EN":
      return category.nombre_en;
    case "ES":
      return category.nombre_es;
    case "DE":
      return category.nombre_de;
    default:
      return category.nombre_en; // Default to English if language is not recognized
  }
};

const staticTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  portfolio: {
    EN: "Portfolio",
    ES: "Portafolio",
    DE: "Portfolio",
  },
  contact: {
    EN: "Contact",
    ES: "Contacto",
    DE: "Kontakt",
  },
  brand: {
    EN: "CLAUDIO A. DEV",
    ES: "CLAUDIO A. DEV",
    DE: "CLAUDIO A. DEV",
  },
  more: {
    EN: "More",
    ES: "Más",
    DE: "Mehr",
  },
  categories: {
    EN: "Categories",
    ES: "Categorías",
    DE: "Kategorien",
  },
  loading: {
    EN: "Loading...",
    ES: "Cargando...",
    DE: "Laden...",
  },
  errorLoading: {
    EN: "Error loading data:",
    ES: "Error al cargar datos:",
    DE: "Fehler beim Laden der Daten:",
  },
};

const getStaticLabel = (key: string, lang: LanguageCode): string => {
  return (
    staticTranslations[key]?.[lang] || staticTranslations[key]?.["ES"] || key
  );
};

const Navbar = () => {
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [isNavMenuExpanded, setIsNavMenuExpanded] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] =
    useState<boolean>(false);
  const [charging, setCharging] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] =
    useState<boolean>(false);

  // (useEffect para fetchData permanece igual)
  // ...
  useEffect(() => {
    const urlApi = "http://127.0.0.1:5000/categorias";
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch(urlApi);
        if (!response.ok) {
          throw new Error("HTTPS error: " + response.status);
        }
        const jsonData: ApiResponse = (await response.json()) as ApiResponse;
        setData(jsonData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Ocurrió un error desconocido al cargar categorías.");
        }
        setData(null);
      } finally {
        setCharging(false);
      }
    };
    fetchData();
  }, []);

  const toggleCategoriesDropdown = () => {
    setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen);
    if (!isCategoriesDropdownOpen && isLanguageDropdownOpen)
      setIsLanguageDropdownOpen(false);
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
    if (!isLanguageDropdownOpen && isCategoriesDropdownOpen)
      setIsCategoriesDropdownOpen(false);
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    setCurrentLanguage(langCode);
    setIsNavMenuExpanded(false); // Cierra el menú móvil si está abierto
    setIsCategoriesDropdownOpen(false); // Cierra otros dropdowns
    setIsLanguageDropdownOpen(false); // Cierra este dropdown
  };

  const handleNavMenuToggle = () => {
    const newExpandedState = !isNavMenuExpanded;
    setIsNavMenuExpanded(newExpandedState);
    if (!newExpandedState) {
      setIsCategoriesDropdownOpen(false);
      setIsLanguageDropdownOpen(false);
    }
  };

  const handleCategoryItemClick = () => {
    setIsCategoriesDropdownOpen(false);
    if (isNavMenuExpanded) {
      setIsNavMenuExpanded(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <a href="/">{getStaticLabel("brand", currentLanguage)}</a>
        <button
          className="navbar-toggle"
          onClick={handleNavMenuToggle}
          aria-expanded={isNavMenuExpanded}
          aria-label="Toggle navigation"
        >
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      </div>

      <div className={`navbar-menu ${isNavMenuExpanded ? "is-active" : ""}`}>
        <div className="navbar-start">
          <a href="/portfolio" className="navbar-item">
            {getStaticLabel("portfolio", currentLanguage)}
          </a>
        </div>

        <div className="navbar-end">
          <div className="navbar-item has-dropdown">
            <button
              onClick={toggleCategoriesDropdown}
              className={`navbar-link ${
                isCategoriesDropdownOpen ? "is-active-dropdown-button" : ""
              }`}
              aria-haspopup="true"
              aria-expanded={isCategoriesDropdownOpen}
            >
              {getStaticLabel("categories", currentLanguage)}
            </button>
          </div>

          <a href="/contact" className="navbar-item">
            {getStaticLabel("contact", currentLanguage)}
          </a>

          {/* Menú desplegable de idiomas modificado */}
          <div className="navbar-item has-dropdown">
            {" "}
            {/* Contenedor existente */}
            <button
              onClick={toggleLanguageDropdown}
              className={`navbar-link language-selector-button ${
                isLanguageDropdownOpen ? "is-open" : ""
              }`}
              aria-haspopup="true"
              aria-expanded={isLanguageDropdownOpen}
            >
              <span
                className="language-icon"
                role="img"
                aria-label="Select language"
              >
                🌐
              </span>
              <span className="current-lang-text">{currentLanguage}</span>
              <span className="dropdown-chevron"></span>{" "}
              {/* Estilizado por CSS */}
            </button>
            {isLanguageDropdownOpen && (
              <div className="navbar-dropdown is-right language-dropdown-menu">
                <button
                  className={`navbar-item language-option ${
                    currentLanguage === "ES" ? "is-active-lang" : ""
                  }`}
                  onClick={() => handleLanguageChange("ES")}
                >
                  <span>Español</span>
                  {currentLanguage === "ES" && (
                    <span className="active-lang-indicator">✓</span>
                  )}
                </button>
                <button
                  className={`navbar-item language-option ${
                    currentLanguage === "EN" ? "is-active-lang" : ""
                  }`}
                  onClick={() => handleLanguageChange("EN")}
                >
                  <span>English</span>
                  {currentLanguage === "EN" && (
                    <span className="active-lang-indicator">✓</span>
                  )}
                </button>
                <button
                  className={`navbar-item language-option ${
                    currentLanguage === "DE" ? "is-active-lang" : ""
                  }`}
                  onClick={() => handleLanguageChange("DE")}
                >
                  <span>Deutsch</span>
                  {currentLanguage === "DE" && (
                    <span className="active-lang-indicator">✓</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor para el dropdown horizontal de categorías (sin cambios aquí) */}
      {isCategoriesDropdownOpen && (
        // ... tu código del dropdown horizontal de categorías
        <div className="horizontal-categories-container">
          <div className="horizontal-categories-dropdown">
            {charging && (
              <p className="loading-item">
                {getStaticLabel("loading", currentLanguage)}
              </p>
            )}
            {error && (
              <p className="error-item">
                {getStaticLabel("errorLoading", currentLanguage)} {error}
              </p>
            )}
            {data &&
              data.map((category) => (
                <a
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="horizontal-category-item"
                  onClick={handleCategoryItemClick}
                >
                  {getCategoryNameByLanguage(category, currentLanguage)}
                </a>
              ))}
            {!charging && !error && data && data.length === 0 && (
              <p className="no-categories-item">
                No hay categorías disponibles.
              </p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
