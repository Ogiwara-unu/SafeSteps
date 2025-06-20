import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useOffline } from "../../contexts/OfflineContext";

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  userId?: string;
  offline?: boolean; // para distinguir los locales
}

type OfflineAction =
  | { type: "add", data: Omit<Marker, "id">, tempId: string }
  | { type: "delete", id: string }
  | { type: "update", id: string, name: string };

const OFFLINE_QUEUE_KEY = "markers_offline_queue";

function loadOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineAction[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
  const { isOffline } = useOffline();
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(loadOfflineQueue());

  // Persistir la cola offline
  useEffect(() => {
    saveOfflineQueue(offlineQueue);
  }, [offlineQueue]);

  // Suscripción a marcadores (sin autenticación)
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "markers"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          if (typeof data.lat !== 'number' || typeof data.lng !== 'number' || typeof data.name !== 'string') {
            return null;
          }
          return {
            id: doc.id,
            lat: data.lat,
            lng: data.lng,
            name: data.name,
            userId: data.userId
          };
        }).filter(Boolean) as Marker[];
        // Añadir los marcadores offline locales
        setMarkers([...docs, ...offlineQueue.filter(a => a.type === "add").map(a => ({
          ...a.data,
          id: a.tempId,
          offline: true
        }))]);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        alert("Error de sincronización con Firestore: " + error.message);
      }
    );
    return () => unsubscribe();
  }, [offlineQueue]);

  // Procesar cola offline al volver online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      const processQueue = async () => {
        let newQueue: OfflineAction[] = [];
        let changed = false;
        for (const action of offlineQueue) {
          try {
            if (action.type === "add") {
              const ref = await addDoc(collection(db, "markers"), action.data);
              // Reemplazar el marcador temporal por el real
              setMarkers(prev =>
                prev.map(m => m.id === action.tempId ? { ...m, id: ref.id, offline: false } : m)
              );
              changed = true;
            } else if (action.type === "delete") {
              await deleteDoc(doc(db, "markers", action.id));
              changed = true;
            } else if (action.type === "update") {
              await updateDoc(doc(db, "markers", action.id), { name: action.name });
              changed = true;
            }
          } catch (e) {
            // Si falla, mantener en la cola
            newQueue.push(action);
          }
        }
        setOfflineQueue(newQueue);
        if (changed) setLoading(true); // Forzar recarga
      };
      processQueue();
    }
  }, [isOffline, offlineQueue]);

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
    const data = { lat, lng, name };
    if (isOffline) {
      const tempId = `offline-${Date.now()}-${Math.random()}`;
      setOfflineQueue(prev => [...prev, { type: "add", data, tempId }]);
      setMarkers(prev => [...prev, { ...data, id: tempId, offline: true }]);
      alert("Marcador guardado localmente. Se sincronizará al volver en línea.");
      return;
    }
    try {
      await addDoc(collection(db, "markers"), data);
    } catch (e) {
      alert("Error al agregar el marcador.");
      console.error(e);
    }
  };

  const deleteMarker = async (id: string, name: string) => {
    if (isOffline) {
      setOfflineQueue(prev => [...prev, { type: "delete", id }]);
      setMarkers(prev => prev.filter(m => m.id !== id));
      setSelectedMarkers(prev => prev.filter(markerId => markerId !== id));
      alert(`Marcador "${name}" eliminado localmente. Se sincronizará al volver en línea.`);
      return;
    }
    try {
      await deleteDoc(doc(db, "markers", id));
      setSelectedMarkers(prev => prev.filter(markerId => markerId !== id));
      alert(`Marcador "${name}" eliminado correctamente.`);
    } catch (e) {
      alert(`Error al eliminar el marcador "${name}".`);
      console.error(e);
    }
  };

  const updateMarker = async (id: string, name: string) => {
    if (isOffline) {
      setOfflineQueue(prev => [...prev, { type: "update", id, name }]);
      setMarkers(prev => prev.map(marker =>
        marker.id === id ? { ...marker, name } : marker
      ));
      alert("Cambio guardado localmente. Se sincronizará al volver en línea.");
      return;
    }
    try {
      await updateDoc(doc(db, "markers", id), { name });
    } catch (e) {
      alert("Error al editar el marcador.");
      console.error(e);
    }
  };

  return {
    markers,
    loading,
    addMarker,
    deleteMarker,
    updateMarker,
    selectedMarkers,
    toggleMarkerSelection
  };
}