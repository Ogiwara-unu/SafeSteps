import React, { useState } from "react";
import { getFirestore, collection, addDoc, setDoc, query, where, getDocs, doc } from "firebase/firestore";
// Si usas Firebase Auth para obtener el usuario actual:
import { getAuth } from "firebase/auth";

interface ShareLocationProps {
  userIds: string[]
  buttonClass?: string;
  messageClass?: string;
}

export const ShareLocation: React.FC<ShareLocationProps> = ({
  userIds,
  buttonClass,
  messageClass,
}) => {
  const [mensaje, setMensaje] = useState<string>("");

  // Función para obtener la ubicación actual del navegador
  const obtenerUbicacion = (): Promise<{ latitude: number; longitude: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => reject(err)
        );
      }
    });

  // Función para compartir ubicación con usuarios seleccionados
  const compartirUbicacionConUsuarios = async (
  userIds: string[],
  ubicacion: { latitude: number; longitude: number },
  fromUserId: string
) => {
  const db = getFirestore();
  const timestamp = new Date();

  for (const uid of userIds) {
    const ref = collection(db, "users", uid, "sharedLocations");

    // Consultamos si ya hay un documento para este fromUserId
    const q = query(ref, where("from", "==", fromUserId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Ya existe: actualizamos el primero que encontremos
      const existingDoc = snapshot.docs[0];
      await setDoc(
        doc(ref, existingDoc.id),
        { location: ubicacion, from: fromUserId, timestamp },
        { merge: true }
      );
    } else {
      // No existe: creamos uno nuevo
      await addDoc(ref, { location: ubicacion, from: fromUserId, timestamp });
    }
  }
};

  const handleShare = async () => {
    setMensaje("");
    try {
      if (userIds.length === 0) {
        setMensaje("Selecciona al menos un usuario.");
        return;
      }
      const ubicacion = await obtenerUbicacion();
      const auth = getAuth();
      const fromUserId = auth.currentUser?.uid;
      if (!fromUserId) {
        setMensaje("No se pudo obtener el usuario actual.");
        return;
      }
      await compartirUbicacionConUsuarios(userIds, ubicacion, fromUserId);
      setMensaje("¡Ubicación compartida exitosamente!");
    } catch (error: any) {
      setMensaje("Error al compartir ubicación: " + error.message);
    }
  };

  return (
    <div>
      <button className={buttonClass} onClick={handleShare}>
        Compartir ubicación
      </button>
      {mensaje && <div className={messageClass}>{mensaje}</div>}
    </div>
  );
};

export default ShareLocation;