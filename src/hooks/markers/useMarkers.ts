import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);

  const loadMarkers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "markers"));
    const loaded = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: data.lat,
        lng: data.lng,
        name: data.name || "(Sin nombre)"
      };
    });
    setMarkers(loaded);
  }, []);

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
    const docRef = await addDoc(collection(db, "markers"), { lat, lng, name });
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