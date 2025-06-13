import React, { useState } from "react";
import { useLocationTracker } from "../../../hooks/locations/useLocationTracker";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { UserData } from "../../../models/User";
import { getAuth } from "firebase/auth";
import { arrayUnion } from "firebase/firestore";



interface ShareLocationProps {
  userIds: string[];
  buttonClass?: string;
  messageClass?: string;
}

export const ShareLocation: React.FC<ShareLocationProps> = ({
  userIds,
  buttonClass,
  messageClass,
}) => {
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const { getCurrentPosition } = useLocationTracker();

const compartirUbicacion = async () => {
  setEnviando(true);
  setMensaje("");
  try {
    const pos = await getCurrentPosition();
    if (!pos || !pos.coords) {
      setMensaje("No se pudo obtener la ubicación.");
    } else {
      const { latitude, longitude } = pos.coords;
      const db = getFirestore();
      const auth = getAuth();
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        setMensaje("No hay usuario autenticado.");
      } else {
        // Actualiza ubicación y trustedContacts
        await updateDoc(doc(db, "users", currentUserId), {
          location: { latitude, longitude, timestamp: Date.now() },
          trustedContacts: arrayUnion(...userIds),
        });
        setMensaje("¡Ubicación compartida!");
      }
    }
  } catch (err) {
    setMensaje("No se pudo obtener la ubicación.");
  }
  setEnviando(false);
};
  return (
    <div>
      <button
        onClick={compartirUbicacion}
        disabled={enviando || userIds.length === 0}
        className={buttonClass}
      >
        Compartir mi ubicación
      </button>
      {mensaje && <div className={messageClass}>{mensaje}</div>}
    </div>
  );
};