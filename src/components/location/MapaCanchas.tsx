import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText, IonButton, IonIcon } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";
import { locateOutline } from "ionicons/icons";

const MapaComercios: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const circleIds = useRef<string[]>([]);
  const { location, loading, startTracking, stopTracking, requestPermissions } = useLocationTracker();
  const [mapReady, setMapReady] = useState(false);

  const clearCircles = async () => {
    if (mapInstance.current && circleIds.current.length > 0) {
      await mapInstance.current.removeCircles(circleIds.current);
      circleIds.current = [];
    }
  };

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
          zoom: location?.coords ? 15 : 8,
          disableDefaultUI: true,
        },
      });

      setMapReady(true);
      
      if (location?.coords) {
        await updateLocationCircles();
      }
    } catch (error) {
      console.error("Error al inicializar el mapa:", error);
    }
  }

  const updateLocationCircles = async () => {
    if (!mapInstance.current || !location?.coords) return;

    try {
      // 1. Limpiar círculos anteriores
      await clearCircles();

      // 2. Crear nuevo punto azul (círculo pequeño)
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
        // Círculo de precisión (opcional)
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

  // Nueva función para centrar manualmente
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

  const cleanUpMap = async () => {
    if (mapInstance.current) {
      try {
        await clearCircles();
        await mapInstance.current.destroy();
      } catch (error) {
        console.error("Error en limpieza:", error);
      }
    }
  };

  useEffect(() => {
    requestPermissions();
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    createMap();

    return () => {
      cleanUpMap();
    };
  }, []);

  useEffect(() => {
    if (location) {
      updateLocationCircles();
    }
  }, [location]);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {mapReady && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000
        }}>
          <IonButton 
            onClick={centerMapOnLocation}
            shape="round"
            size="small"
          >
            <IonIcon icon={locateOutline} />
          </IonButton>
        </div>
      )}

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

export default MapaComercios;