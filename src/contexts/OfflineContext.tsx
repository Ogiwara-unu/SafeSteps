// src/contexts/OfflineContext.tsx
import { createContext, useContext, useState } from 'react';
import { FirebaseService } from '../firebase/firebasetoggleofflineservice';

type OfflineContextType = {
  isOffline: boolean;
  toggleOffline: () => void;
};

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  toggleOffline: () => {},
});

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);

  const toggleOffline = async () => {
    const newState = await FirebaseService.toggleNetwork();
    setIsOffline(newState);
  };

  return (
    <OfflineContext.Provider value={{ isOffline, toggleOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);