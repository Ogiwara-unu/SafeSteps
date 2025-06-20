import { useEffect, useRef, useState } from "react";
import { getFirestore, collection, addDoc, setDoc, query, where, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export function useRealTimeLocationShare(userIds: string[], intervalMs = 5000) {
  const [isSharing, setIsSharing] = useState(false);
  const timerRef = useRef<number | null>(null); // guardamos el id del intervalo
  
  const obtenerUbicacion = async () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err)
      );
    });
  };
  
  const enviarUbicacion = async () => {
    const ubicacion = await obtenerUbicacion();
    const auth = getAuth();
    const fromUserId = auth.currentUser?.uid;
    if (!fromUserId) return;

    const db = getFirestore();
    const timestamp = new Date();
    console.log(fromUserId)
    for (const uid of userIds) {
      const ref = collection(db, "users", uid, "sharedLocations");
      const q = query(ref, where("from", "==", fromUserId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await setDoc(
          doc(ref, snapshot.docs[0].id),
          { location: ubicacion, from: fromUserId, timestamp },
          { merge: true }
        );
      } else {
        await addDoc(ref, { location: ubicacion, from: fromUserId, timestamp });
      }
    }
  };
  
  useEffect(() => {
    if (isSharing) {
      // configurar el intervalo
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
  
  return { isSharing, start: () => setIsSharing(true), stop: () => setIsSharing(false) };
}