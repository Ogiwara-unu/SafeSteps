import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  userId: string;
  offline?: boolean;
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
function isAddAction(action: OfflineAction): action is { type: "add", data: Omit<Marker, "id">, tempId: string } {
  return action.type === "add";
}

export function useMarkers() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(loadOfflineQueue());
  const [userId, setUserId] = useState<string | undefined>(undefined);


  useEffect(() => {
    const handleOnline = () => {
      setOfflineQueue((q) => [...q]); // Fuerza el efecto de sincronización
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  
  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUserId(user?.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    saveOfflineQueue(offlineQueue);
  }, [offlineQueue]);

  // Suscripción a marcadores del usuario actual (en tiempo real)
  useEffect(() => {
    if (!userId) {
      setMarkers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "markers"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            lat: data.lat,
            lng: data.lng,
            name: data.name || "(Sin nombre)",
            userId: data.userId
          };
        });
        setMarkers([
          ...docs,
          ...offlineQueue
            .filter(isAddAction)
            .filter(a => a.data.userId === userId)
            .map(a => ({
              ...a.data,
              id: a.tempId,
              offline: true
            }))
        ]);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        alert("Error de sincronización con Firestore: " + error.message);
      }
    );
    return () => unsubscribe();
  }, [offlineQueue, userId]);

  // Procesar cola offline al volver online
  useEffect(() => {
    if (navigator.onLine && offlineQueue.length > 0 && userId) {
      const processQueue = async () => {
        let newQueue: OfflineAction[] = [];
        let changed = false;
        for (const action of offlineQueue) {
          try {
            if (action.type === "add" && action.data.userId === userId) {
              const ref = await addDoc(collection(db, "markers"), action.data);
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
            newQueue.push(action);
          }
        }
        if (changed) {
          // Forzar recarga de marcadores desde Firestore
          setMarkers([]);
        }
        setOfflineQueue(newQueue);
      };
      processQueue();
    }
  }, [offlineQueue, userId]);

  // Alternar selección de marcadores (máximo 2)
  const toggleMarkerSelection = (id: string) => {
    setSelectedMarkers(prev =>
      prev.includes(id)
        ? prev.filter(markerId => markerId !== id)
        : prev.length < 2
          ? [...prev, id]
          : [prev[1], id]
    );
  };

  // Agregar marcador
  const addMarker = async (lat: number, lng: number, name: string) => {
    if (!userId) return;
    const data = { lat, lng, name, userId };
    if (!navigator.onLine) {
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

  // Eliminar marcador
  const deleteMarker = async (id: string, name: string) => {
    if (!navigator.onLine) {
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

  // Actualizar marcador
  const updateMarker = async (id: string, name: string) => {
    if (!navigator.onLine) {
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
    toggleMarkerSelection,
    selectedMarkers
  };
}