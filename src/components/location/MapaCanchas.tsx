import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText, IonButton, IonIcon } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";
import { locateOutline, pinOutline, listOutline, closeOutline } from "ionicons/icons";
import { useMarkers } from "../../hooks/useMarkers";
import { MarkerModal } from "./MarkerModal";
import { MarkerList } from "./MarkerList";

const MapaCanchas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const circleIds = useRef<string[]>([]);
  const markerIds = useRef<{ [id: string]: string }>({});
  const { location, loading, startTracking, stopTracking, requestPermissions } = useLocationTracker();
  const [mapReady, setMapReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [markerName, setMarkerName] = useState("");
  const [editingMarker, setEditingMarker] = useState<any | null>(null);
  const [showList, setShowList] = useState(false);

  // Usa el hook de marcadores
  const { markers, loadMarkers, addMarker, deleteMarker, updateMarker } = useMarkers();

  // --- Map helpers ---
  const clearCircles = async () => {
    if (mapInstance.current && circleIds.current.length > 0) {
      try {
        await mapInstance.current.removeCircles(circleIds.current);
      } catch (e) {}
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
      setMapReady(true);
    } catch (error) {
      console.error("Error al inicializar el mapa:", error);
    }
  }

  const updateLocationCircles = async () => {
    if (!mapInstance.current || !location?.coords) return;
    try {
      if (circleIds.current.length > 0) {
        await mapInstance.current.removeCircles(circleIds.current);
        circleIds.current = [];
      }
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

  // --- Renderiza marcadores en el mapa ---
  const renderMarkers = async () => {
    if (!mapInstance.current) return;
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

  // --- Modal handlers ---
  const addCurrentLocationMarker = () => {
    setMarkerName("");
    setEditingMarker(null);
    setShowModal(true);
  };

  const handleSaveMarker = async (name: string) => {
    if (!name.trim() || !location?.coords) return;
    await addMarker(location.coords.latitude, location.coords.longitude, name.trim());
    setShowModal(false);
    setMarkerName("");
    window.alert("¡Marcador agregado correctamente!");
  };

  const handleDeleteMarker = async (id: string) => {
    await deleteMarker(id);
    await loadMarkers();
  };

  const handleEditMarker = (marker: any) => {
    setEditingMarker(marker);
    setMarkerName(marker.name);
    setShowModal(true);
  };

  const handleUpdateMarker = async (name: string) => {
    if (!name.trim() || !editingMarker) return;
    await updateMarker(editingMarker.id, name.trim());
    setShowModal(false);
    setEditingMarker(null);
    setMarkerName("");
    await loadMarkers();
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
    loadMarkers();
    return () => {
      stopTracking();
      cleanUpMap();
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
    updateLocationCircles();
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

      {/* Lista de marcadores */}
      {showList && (
        <div style={{
          position: "absolute",
          top: "64px",
          right: "20px",
          zIndex: 1000
        }}>
          <MarkerList
            markers={markers}
            onEdit={handleEditMarker}
            onDelete={handleDeleteMarker}
          />
        </div>
      )}

      {/* Modal para agregar/editar marcador */}
      <MarkerModal
        isOpen={showModal}
        initialName={markerName}
        onClose={() => { setShowModal(false); setEditingMarker(null); }}
        onSave={editingMarker ? handleUpdateMarker : handleSaveMarker}
        editing={!!editingMarker}
      />

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