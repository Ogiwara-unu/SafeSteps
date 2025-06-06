import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText, IonButton, IonIcon, IonModal, IonInput, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";
import { locateOutline, pinOutline, trashOutline, createOutline, map, listOutline, closeOutline } from "ionicons/icons";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const MapaCanchas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const circleIds = useRef<string[]>([]);
  const markerIds = useRef<{ [id: string]: string }>({});
  const isUpdatingRef = useRef(false);
  const { location, loading, startTracking, stopTracking, requestPermissions } = useLocationTracker();
  const [mapReady, setMapReady] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [markerName, setMarkerName] = useState("");
  const [editingMarker, setEditingMarker] = useState<any | null>(null);
  const [showList, setShowList] = useState(false);

  // --- Firestore helpers ---
  const loadMarkersFromFirestore = async () => {
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
  };

  const saveMarkerToFirestore = async (lat: number, lng: number, name: string) => {
    // Firestore crea la colección automáticamente si no existe
    return await addDoc(collection(db, "markers"), { lat, lng, name });
  };

  const deleteMarkerFromFirestore = async (id: string) => {
    await deleteDoc(doc(db, "markers", id));
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const updateMarkerNameInFirestore = async (id: string, name: string) => {
    await updateDoc(doc(db, "markers", id), { name });
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  // --- Map helpers ---
  const clearCircles = async () => {
    if (mapInstance.current && circleIds.current.length > 0) {
      try {
        await mapInstance.current.removeCircles(circleIds.current);
      } catch (e) {
        // Si el mapa ya no existe, ignora el error
      }
      circleIds.current = [];
    }
  };

  const clearMarkers = async () => {
    if (mapInstance.current && Object.values(markerIds.current).length > 0) {
      await mapInstance.current.removeMarkers(Object.values(markerIds.current));
      markerIds.current = {};
    }
  };

  async function createMap() {
    if (!mapRef.current || mapInstance.current) return;
    await clearCircles();
    try {
      mapInstance.current = await GoogleMap.create({
        id: "canchas-map",
        element: mapRef.current,
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        config: {
          center: {
            lat: location?.coords?.latitude || 10.61822486603641,
            lng: location?.coords?.longitude || -85.4529675470169,
          },
          zoom: location?.coords ? 15 : 8,
          disableDefaultUI: true,
        },
      });
      console.log("Mapa creado:", mapInstance.current);

      setMapReady(true);
    } catch (error) {
      console.error("Error al inicializar el mapa:", error);
    }
  }

  const updateLocationCircles = async () => {
    if (!mapInstance.current || !location?.coords) return;

    try {
      // Limpia primero cualquier círculo existente
      if (circleIds.current.length > 0) {
        await mapInstance.current.removeCircles(circleIds.current);
        circleIds.current = [];
      }

      // Agrega los nuevos círculos
      const newCircleIds = await mapInstance.current.addCircles([
        {
          center: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
          radius: 5,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeOpacity: 1,
          strokeWeight: 1
        },
        {
          center: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
          radius: location.coords.accuracy || 50,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeOpacity: 0.5,
          strokeWeight: 1
        }
      ]);
      circleIds.current = newCircleIds;
    } catch (error) {
      console.error("Error actualizando círculos:", error);
    }
  };

  const centerMapOnLocation = async () => {
    if (mapInstance.current && location?.coords) {
      await mapInstance.current.setCamera({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        zoom: 15,
        animate: true
      });
    }
  };

  // --- Marcadores personalizados ---
  const renderMarkers = async () => {
    if (!mapInstance.current) {
      console.warn("Intentando renderizar marcadores pero el mapa no está listo.");
      return;
    }

    await clearMarkers();

    for (const marker of markers) {
      try {
        const ids = await mapInstance.current.addMarkers([
          {
            coordinate: { lat: marker.lat, lng: marker.lng },
            title: marker.name,
            snippet: "Marcador guardado",
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          }
        ]);
        markerIds.current[marker.id] = ids[0];
      } catch (err) {
        console.error("Error al añadir marcador:", err);
      }
    }
  };


  // --- Agregar marcador con nombre (usando modal) ---
  const addCurrentLocationMarker = async () => {
    setMarkerName("");
    setShowModal(true);
  };

  const handleSaveMarker = async () => {
    if (!markerName.trim() || !location?.coords) return;
    try {
      await saveMarkerToFirestore(location.coords.latitude, location.coords.longitude, markerName.trim());
      await loadMarkersFromFirestore(); // Recarga la lista
      setShowModal(false);
      setMarkerName("");
      window.alert("¡Marcador agregado correctamente!");
    } catch (error) {
      window.alert("Error al agregar el marcador. Intenta de nuevo.");
      console.error(error);
    }
  };

  // --- Eliminar marcador ---
  const handleDeleteMarker = async (id: string) => {
    await deleteMarkerFromFirestore(id);
    await loadMarkersFromFirestore(); // <-- recarga desde Firestore
  };

  // --- Editar marcador (usando modal) ---
  const handleEditMarker = (marker: any) => {
    setEditingMarker(marker);
    setMarkerName(marker.name);
    setShowModal(true);
  };

  const handleUpdateMarker = async () => {
    if (!markerName.trim() || !editingMarker) return;
    await updateMarkerNameInFirestore(editingMarker.id, markerName.trim());
    setShowModal(false);
    setEditingMarker(null);
    setMarkerName("");
    await loadMarkersFromFirestore(); // <-- recarga desde Firestore
  };

  const cleanUpMap = async () => {
    if (mapInstance.current) {
      try {
        await clearCircles();
        await clearMarkers();
        await mapInstance.current.destroy();
      } catch (error) {
        console.error("Error en limpieza:", error);
      }
    }
  };

  // --- Efectos ---
  useEffect(() => {
    requestPermissions();
    startTracking();
    loadMarkersFromFirestore();

    return () => {
      stopTracking();
      cleanUpMap(); // Usa cleanUpMap en lugar de solo clearCircles
    };
  }, []);

  useEffect(() => {
    createMap();
    return () => {
      cleanUpMap();
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !location?.coords) return;

    const updateCircles = async () => {
      try {
        await updateLocationCircles();
      } catch (error) {
        console.error("Error updating circles:", error);
      }
    };

    updateCircles();
  }, [location, mapReady]);


  useEffect(() => {
    if (mapReady && mapInstance.current) {
      renderMarkers();
    }
  }, [markers, mapReady]);


  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "row",
        gap: "8px"
      }}>
        <IonButton
          onClick={centerMapOnLocation}
          shape="round"
          size="small"
        >
          <IonIcon icon={locateOutline} />
        </IonButton>
        <IonButton
          onClick={addCurrentLocationMarker}
          shape="round"
          size="small"
          color="warning"
        >
          <IonIcon icon={pinOutline} />
        </IonButton>
      </div>

      {/* Botón flotante para mostrar/ocultar la lista */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        zIndex: 1100
      }}>
        <IonButton
          size="small"
          shape="round"
          onClick={() => setShowList(v => !v)}
          style={{ minWidth: 0, width: 36, height: 36, padding: 0 }}
          color="light"
        >
          <IonIcon icon={showList ? closeOutline : listOutline} />
        </IonButton>
      </div>

      {/* Lista de marcadores para editar/eliminar */}
      {showList && (
        <div style={{
          position: "absolute",
          top: "64px",
          right: "20px",
          zIndex: 1000,
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: "8px",
          maxWidth: "180px",
          minWidth: "120px"
        }}>
          <strong style={{ fontSize: 13, color: "#222" }}>Marcadores</strong>
          <div style={{ maxHeight: "180px", overflowY: "auto" }}>
            {markers.map(marker => (
              <div key={marker.id} style={{
                borderBottom: "1px solid #eee",
                padding: "4px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#222",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 90
                }}>
                  {marker.name || "(Sin nombre)"}
                </span>
                <div style={{ display: "flex", gap: "2px" }}>
                  <IonButton size="small" fill="clear" onClick={() => handleEditMarker(marker)}>
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonButton size="small" fill="clear" color="danger" onClick={() => handleDeleteMarker(marker.id)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para agregar/editar marcador */}
      <IonModal
        isOpen={showModal}
        onDidDismiss={() => { setShowModal(false); setEditingMarker(null); }}
        className="custom-marker-modal"
        backdropDismiss={true}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 18, textAlign: "center" }}>
              {editingMarker ? "Editar marcador" : "Agregar marcador"}
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: 16 }}>
            <IonInput
              label="Nombre"
              labelPlacement="floating"
              placeholder="Ej: Parque, Panadería..."
              value={markerName}
              onIonInput={e => setMarkerName(e.detail.value ?? "")}
              clearInput
              style={{ fontSize: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 8 }}>
              <IonButton onClick={() => { setShowModal(false); setEditingMarker(null); }} color="medium">
                Cancelar
              </IonButton>
              {editingMarker ? (
                <IonButton onClick={handleUpdateMarker} disabled={!markerName.trim()}>
                  Guardar
                </IonButton>
              ) : (
                <IonButton onClick={handleSaveMarker} disabled={!markerName.trim()}>
                  Agregar
                </IonButton>
              )}
            </div>
          </div>
        </IonContent>
      </IonModal>

      {loading && !location?.coords && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1000
        }}>
          <IonSpinner name="crescent" color="primary" />
          <IonText color="primary">Obteniendo ubicación...</IonText>
        </div>
      )}
    </div>
  );
};

export default MapaCanchas;