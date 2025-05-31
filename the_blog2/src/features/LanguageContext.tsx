import React, { createContext, useState, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

export type LanguageCode = "ES" | "EN" | "DE";

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setCurrentLanguage: Dispatch<SetStateAction<LanguageCode>>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("EN"); // Idioma por defecto

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage debe ser usado dentro de un LanguageProvider");
  }
  return context;
};
