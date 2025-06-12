import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const userId = getAuth().currentUser?.uid;


export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  userId: string; // Nuevo campo
}
export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);

  const loadMarkers = async () => {
  const userId = getAuth().currentUser?.uid;
  if (!userId) {
    setMarkers([]);
    return;
  }
  const q = query(collection(db, "markers"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const loaded = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      lat: data.lat,
      lng: data.lng,
      name: data.name || "(Sin nombre)",
      userId: data.userId
    };
  });
  setMarkers(loaded);
};
  const toggleMarkerSelection = (id: string) => {
    setSelectedMarkers(prev => 
      prev.includes(id) 
        ? prev.filter(markerId => markerId !== id)
        : prev.length < 2 
          ? [...prev, id] 
          : [prev[1], id]
    );
  };

  const addMarker = async (lat: number, lng: number, name: string) => {
  const userId = getAuth().currentUser?.uid;
  if (!userId) return;
  const docRef = await addDoc(collection(db, "markers"), { lat, lng, name, userId });
  await loadMarkers();
  return docRef.id;
};

  const deleteMarker = async (id: string) => {
    await deleteDoc(doc(db, "markers", id));
    setMarkers(prev => prev.filter(m => m.id !== id));
    setSelectedMarkers(prev => prev.filter(markerId => markerId !== id));
  };

  const updateMarker = async (id: string, name: string) => {
    await updateDoc(doc(db, "markers", id), { name });
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  return { 
    markers, 
    loadMarkers, 
    addMarker, 
    deleteMarker, 
    updateMarker,
    selectedMarkers,
    toggleMarkerSelection
  };
}