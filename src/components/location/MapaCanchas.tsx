import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";

const MapaComercios: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const [markerIds, setMarkerIds] = useState<string[]>([]);
  const { location, loading, error, startTracking, stopTracking, requestPermissions } = useLocationTracker();

  async function createMap() {
    if (!mapRef.current) return;

    try {
      mapInstance.current = await GoogleMap.create({
        id: "comercios-map",
        element: mapRef.current,
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        config: {
          center: {
            lat: location?.coords?.latitude || 10.61822486603641,
            lng: location?.coords?.longitude || -85.4529675470169,
          },
          zoom: location?.coords ? 12 : 8,
          disableDefaultUI: true,
        },
      });

      if (location?.coords) {
        await updateMapLocation();
      }
    } catch (error) {
      console.error("Error al inicializar el mapa:", error);
    }
  }

  const updateMapLocation = async () => {
    if (mapInstance.current && location?.coords) {
      // Mover la cámara a la nueva ubicación
      await mapInstance.current.setCamera({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        zoom: 12
      });
      
      // Eliminar marcadores anteriores si existen
      if (markerIds.length > 0) {
        await mapInstance.current.removeMarkers(markerIds);
        setMarkerIds([]);
      }
      
      // Agregar nuevo marcador y guardar su ID
      const newMarkerId = await mapInstance.current.addMarker({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        title: "Tu posición",
      });
      
      setMarkerIds([newMarkerId]);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    createMap();

    return () => {
      if (mapInstance.current) {
        // Limpiar marcadores antes de destruir el mapa
        if (markerIds.length > 0) {
          mapInstance.current.removeMarkers(markerIds).catch(console.error);
        }
        mapInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (location) {
      updateMapLocation();
    }
  }, [location]);

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {loading && !location?.coords && (
        <div className="loading-indicator">
          <IonSpinner name='crescent' color='primary' />
          <IonText>Obteniendo ubicación...</IonText>
        </div>
      )}
    </div>
  );
};

export default MapaComercios;