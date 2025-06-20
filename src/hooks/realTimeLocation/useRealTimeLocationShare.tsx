import { useEffect, useRef, useState } from "react";
import { getFirestore, collection, addDoc, setDoc, query, where, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export function useRealTimeLocationShare(userIds: string[], intervalMs = 5000) {
  const [isSharing, setIsSharing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const obtenerUbicacion = async () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err)
      );
    });
  };

  const actualizarEstadoCompartiendo = async (fromUserId: string, compartiendo: boolean) => {
    const db = getFirestore();

    for (const uid of userIds) {
      const ref = collection(db, "users", uid, "sharedLocations");
      const q = query(ref, where("from", "==", fromUserId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await setDoc(
          doc(ref, snapshot.docs[0].id),
          { compartiendo },
          { merge: true }
        );
      }
    }
  };

  const enviarUbicacion = async () => {
    const ubicacion = await obtenerUbicacion();
    console.log("Ubicación obtenida:", ubicacion);
    const auth = getAuth();
    const fromUserId = auth.currentUser?.uid;
    if (!fromUserId) return;

    const db = getFirestore();
    const timestamp = new Date();

    for (const uid of userIds) {
      const ref = collection(db, "users", uid, "sharedLocations");
      const q = query(ref, where("from", "==", fromUserId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await setDoc(
          doc(ref, snapshot.docs[0].id),
          { location: ubicacion, from: fromUserId, timestamp, compartiendo: true },
          { merge: true }
        );
      } else {
        await addDoc(ref, {
          location: ubicacion,
          from: fromUserId,
          timestamp,
          compartiendo: true
        });
      }
    }
  };

  const start = async () => {
    setIsSharing(true);
    const auth = getAuth();
    const fromUserId = auth.currentUser?.uid;
    if (fromUserId) {
      await actualizarEstadoCompartiendo(fromUserId, true);
    }
  };

  const stop = async () => {
    setIsSharing(false);
    const auth = getAuth();
    const fromUserId = auth.currentUser?.uid;
    if (fromUserId) {
      await actualizarEstadoCompartiendo(fromUserId, false);
    }
  };

  useEffect(() => {
    if (isSharing) {
      timerRef.current = window.setInterval(() => {
        enviarUbicacion().catch(console.error);
      }, intervalMs) as unknown as number;
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSharing, userIds, intervalMs]);

  return { isSharing, start, stop };
}
