import React from "react";
import { useOffline } from "../../contexts/OfflineContext";
import "./OfflineBanner.css";

const OfflineBanner: React.FC = () => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="offline-banner-floating">
      Modo offline: los cambios se sincronizarán al volver en línea.
    </div>
  );
};

export default OfflineBanner;