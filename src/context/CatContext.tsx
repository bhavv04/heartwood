"use client";
import { createContext, useContext, useState } from "react";

interface CatContextType {
  showCat: boolean;
  toggleCat: () => void;
}

const CatContext = createContext<CatContextType | undefined>(undefined);

export function CatProvider({ children }: { children: React.ReactNode }) {
  const [showCat, setShowCat] = useState(true);

  const toggleCat = () => setShowCat((prev) => !prev);

  return (
    <CatContext.Provider value={{ showCat, toggleCat }}>
      {children}
    </CatContext.Provider>
  );
}

export function useCat() {
  const context = useContext(CatContext);
  if (!context) {
    throw new Error("useCat must be used within a CatProvider");
  }
  return context;
}
