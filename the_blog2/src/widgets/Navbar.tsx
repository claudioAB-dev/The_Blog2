// Navbar.tsx

import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { useLanguage } from "../features/LanguageContext";
import type { LanguageCode } from "../features/LanguageContext";
import ContactModal from "./ContactModal";

// ... (tus interfaces y funciones de traducción se mantienen igual)
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
      return category.nombre_en;
  }
};

const staticTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  portfolio: { EN: "Portfolio", ES: "Portafolio", DE: "Portfolio" },
  contact: { EN: "Contact", ES: "Contacto", DE: "Kontakt" },
  brand: { EN: "CLAUDIO A. DEV", ES: "CLAUDIO A. DEV", DE: "CLAUDIO A. DEV" },
  categories: { EN: "Categories", ES: "Categorías", DE: "Kategorien" },
  loading: { EN: "Loading...", ES: "Cargando...", DE: "Laden..." },
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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // NUEVO ESTADO

  const navbarRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNavMenuExpanded &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setIsNavMenuExpanded(false);
        setIsCategoriesDropdownOpen(false);
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNavMenuExpanded]);

  const toggleCategoriesDropdown = () => {
    const newCategoriesOpenState = !isCategoriesDropdownOpen;
    setIsCategoriesDropdownOpen(newCategoriesOpenState);
    if (newCategoriesOpenState && isLanguageDropdownOpen) {
      setIsLanguageDropdownOpen(false);
    }
  };

  const toggleLanguageDropdown = () => {
    const newLanguageOpenState = !isLanguageDropdownOpen;
    setIsLanguageDropdownOpen(newLanguageOpenState);
    if (newLanguageOpenState && isCategoriesDropdownOpen) {
      setIsCategoriesDropdownOpen(false);
    }
  };

  const handleLanguageChange = (langCode: LanguageCode) => {
    setCurrentLanguage(langCode);
    setIsLanguageDropdownOpen(false);
    // No cerramos el menú principal aquí, el usuario podría querer seguir en el menú
  };

  const handleNavMenuToggle = () => {
    const newExpandedState = !isNavMenuExpanded;
    setIsNavMenuExpanded(newExpandedState);
    if (!newExpandedState) {
      setIsCategoriesDropdownOpen(false);
      setIsLanguageDropdownOpen(false);
    }
  };

  const handleSimpleLinkClick = () => {
    if (isNavMenuExpanded) {
      setIsNavMenuExpanded(false);
    }
  };

  const handleCategoryItemClick = () => {
    setIsCategoriesDropdownOpen(false); // Solo cierra el dropdown de categorías
    // Opcionalmente, puedes cerrar el menú principal si es necesario para tu UX en móvil:
    // if (window.innerWidth <= 992) setIsNavMenuExpanded(false);
  };

  const renderCategoriesDropdownContent = () => (
    <>
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
            className="horizontal-category-item" // Esta clase será estilizada diferentemente en móvil
            onClick={handleCategoryItemClick}
          >
            {getCategoryNameByLanguage(category, currentLanguage)}
          </a>
        ))}
      {!charging && !error && data && data.length === 0 && (
        <p className="no-categories-item">No hay categorías disponibles.</p>
      )}
    </>
  );

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Previene la navegación si es un <a> con href
    setIsContactModalOpen(true);
    if (isNavMenuExpanded) {
      // Opcional: cerrar el menú principal si está abierto
      setIsNavMenuExpanded(false);
      setIsCategoriesDropdownOpen(false);
      setIsLanguageDropdownOpen(false);
    }
  };

  return (
    <nav className="navbar" ref={navbarRef}>
      {/* El brand ahora es un hermano directo */}
      <div className="navbar-brand">
        <a href="/">{getStaticLabel("brand", currentLanguage)}</a>
      </div>

      {/* El toggle ahora es un hermano directo, fuera del brand */}
      <button
        className="navbar-toggle"
        onClick={handleNavMenuToggle}
        aria-expanded={isNavMenuExpanded}
        aria-label="Toggle navigation"
        aria-controls="navbarMenuContent"
      >
        <span className="icon-bar"></span>
        <span className="icon-bar"></span>
        <span className="icon-bar"></span>
      </button>

      {/* El menú principal también es un hermano directo */}
      <div
        id="navbarMenuContent"
        className={`navbar-menu ${isNavMenuExpanded ? "is-active" : ""}`}
      >
        <div className="navbar-start">
          <a
            href="/portfolio"
            className="navbar-item"
            onClick={handleSimpleLinkClick}
          >
            {getStaticLabel("portfolio", currentLanguage)}
          </a>
        </div>

        <div className="navbar-end">
          <div className="navbar-item has-dropdown has-dropdown-categories">
            <button
              onClick={toggleCategoriesDropdown}
              className={`navbar-link categories-toggle-button ${
                isCategoriesDropdownOpen ? "is-active-dropdown-button" : ""
              }`}
              aria-haspopup="true"
              aria-expanded={isCategoriesDropdownOpen}
              aria-controls="categoriesDropdownMobile"
            >
              {getStaticLabel("categories", currentLanguage)}
              <span className="dropdown-chevron"></span>
              <span className="mobile-dropdown-chevron"></span>
            </button>
            {isNavMenuExpanded && isCategoriesDropdownOpen && (
              <div
                id="categoriesDropdownMobile"
                className="categories-dropdown-mobile"
              >
                {renderCategoriesDropdownContent()}
              </div>
            )}
          </div>

          <a
            href="#" // O puedes usar un <button> en su lugar
            className="navbar-item"
            onClick={handleContactClick} // Usa la nueva función
            role="button" // Si usas <a> como botón, es bueno para accesibilidad
          >
            {getStaticLabel("contact", currentLanguage)}
          </a>

          <div className="navbar-item has-dropdown has-dropdown-language">
            <button
              onClick={toggleLanguageDropdown}
              className={`navbar-link language-selector-button ${
                isLanguageDropdownOpen ? "is-open" : ""
              }`}
              aria-haspopup="true"
              aria-expanded={isLanguageDropdownOpen}
              aria-controls="languageDropdownMenuContent"
            >
              <span
                className="language-icon"
                role="img"
                aria-label="Select language"
              >
                🌐
              </span>
              <span className="current-lang-text">{currentLanguage}</span>
              <span className="dropdown-chevron"></span>
              <span className="mobile-dropdown-chevron"></span>
            </button>
            {isLanguageDropdownOpen && (
              <div
                id="languageDropdownMenuContent"
                className={`navbar-dropdown language-dropdown-menu ${
                  !isNavMenuExpanded ? "is-right" : ""
                }`}
              >
                <button
                  className={`language-option ${
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
                  className={`language-option ${
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
                  className={`language-option ${
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

      {/* Dropdown de categorías HORIZONTAL para ESCRITORIO (fuera del menú principal) */}
      {!isNavMenuExpanded && isCategoriesDropdownOpen && (
        <div className="horizontal-categories-container">
          <div className="horizontal-categories-dropdown">
            {renderCategoriesDropdownContent()}
          </div>
        </div>
      )}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
