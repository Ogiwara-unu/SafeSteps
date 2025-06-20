// components/location/compartirLocalizacion/ShareLocationButton.tsx
import React from "react";
import { useRealTimeLocationShare } from "./useRealTimeLocationShare";

interface ShareLocationButtonProps {
  userIds: string[];
  intervalMs?: number;
  buttonClass?: string;
}

export const ShareLocationButton: React.FC<ShareLocationButtonProps> = ({
  userIds,
  intervalMs = 5000,
  buttonClass
}) => {
  const { isSharing, start, stop } = useRealTimeLocationShare(userIds, intervalMs);

  return (
    <button className={buttonClass} onClick={isSharing ? stop : start}>
      {isSharing ? "Detener actualización en tiempo real" : "Compartir ubicación en tiempo real"}
    </button>
  );
};