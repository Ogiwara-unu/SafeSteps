import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);

  const loadMarkers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "markers"));
    const loaded = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: typeof data.lat === "number" ? data.lat : 0,
        lng: typeof data.lng === "number" ? data.lng : 0,
        name: typeof data.name === "string" && data.name.trim() !== "" ? data.name : "(Sin nombre)"
      };
    });
    setMarkers(loaded);
  }, []);

  const addMarker = async (lat: number, lng: number, name: string) => {
    await addDoc(collection(db, "markers"), { lat, lng, name });
    await loadMarkers();
  };

  const deleteMarker = async (id: string) => {
    await deleteDoc(doc(db, "markers", id));
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const updateMarker = async (id: string, name: string) => {
    await updateDoc(doc(db, "markers", id), { name });
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  return { markers, loadMarkers, addMarker, deleteMarker, updateMarker };
}