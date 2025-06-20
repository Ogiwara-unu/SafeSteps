// src/contexts/OfflineContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import FirebaseService from "../firebase/firebasetoggleofflineservice";

interface OfflineContextProps {
  isOffline: boolean;
  toggleOffline: () => Promise<void>;
  setOffline: (value: boolean) => void;
}

const OfflineContext = createContext<OfflineContextProps>({
  isOffline: false,
  toggleOffline: async () => {},
  setOffline: () => {},
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(() => {
    const saved = localStorage.getItem("isOffline");
    return saved === "true";
  });

  // Permite cambiar el estado manualmente (por el switch)
  const toggleOffline = async () => {
    const newState = !isOffline;
    setIsOffline(newState);
    localStorage.setItem("isOffline", String(newState));
    if (newState) {
      await FirebaseService.forceOffline();
    } else {
      await FirebaseService.forceOnline();
    }
  };

  // Permite cambiar el estado desde eventos automáticos
  const setOffline = (value: boolean) => {
    setIsOffline(value);
    localStorage.setItem("isOffline", String(value));
    if (value) {
      FirebaseService.forceOffline();
    } else {
      FirebaseService.forceOnline();
    }
  };

  // Sincroniza el estado con Firebase al montar o cambiar
  useEffect(() => {
    if (isOffline) {
      FirebaseService.forceOffline();
    } else {
      FirebaseService.forceOnline();
    }
  }, [isOffline]);

  // Detecta cambios de conectividad y actualiza el estado automáticamente
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Al montar, ajusta según el estado real de la red
    if (!navigator.onLine) setOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline, toggleOffline, setOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};