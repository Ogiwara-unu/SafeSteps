import React, { createContext, useContext, useState, useEffect } from "react";
import FirebaseService from "../firebase/firebasetoggleofflineservice";

interface OfflineContextProps {
  isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextProps>({
  isOffline: false,
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(() => {
    const saved = localStorage.getItem("isOffline");
    return saved === "true";
  });

  // Cambia el estado según la conectividad
  const setOffline = (value: boolean) => {
    setIsOffline(value);
    localStorage.setItem("isOffline", String(value));
    if (value) {
      FirebaseService.forceOffline();
    } else {
      FirebaseService.forceOnline();
    }
  };

  useEffect(() => {
    if (isOffline) {
      FirebaseService.forceOffline();
    } else {
      FirebaseService.forceOnline();
    }
  }, [isOffline]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};