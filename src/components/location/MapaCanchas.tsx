import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";

const MapaComercios: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const markerIds = useRef<string[]>([]); // Cambiamos a useRef para mejor manejo
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
    if (!mapInstance.current || !location?.coords) return;

    try {
      // 1. Eliminar marcadores existentes
      if (markerIds.current.length > 0) {
        await mapInstance.current.removeMarkers(markerIds.current);
        markerIds.current = [];
      }

      // 2. Mover la cámara
      await mapInstance.current.setCamera({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        zoom: 12
      });
      
      // 3. Agregar nuevo marcador
      const newMarkerId = await mapInstance.current.addMarker({
        coordinate: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        title: "Tu posición",
      });
      
      markerIds.current = [newMarkerId];
    } catch (error) {
      console.error("Error actualizando ubicación:", error);
    }
  };

  // Limpieza de marcadores y mapa
  const cleanUpMap = async () => {
    if (mapInstance.current) {
      try {
        if (markerIds.current.length > 0) {
          await mapInstance.current.removeMarkers(markerIds.current);
        }
        await mapInstance.current.destroy();
        mapInstance.current = null;
      } catch (error) {
        console.error("Error en limpieza:", error);
      }
    }
  };

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    createMap();

    return () => {
      cleanUpMap();
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