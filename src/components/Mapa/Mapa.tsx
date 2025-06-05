import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonSpinner,
  IonAlert
} from "@ionic/react";
import { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const Mapa: React.FC = () => {
  const mapRef = useRef<HTMLElement>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newMapRef = useRef<GoogleMap | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Verificar si estamos en un dispositivo nativo
        if (Capacitor.isNativePlatform()) {
          await getCurrentPosition();
        } else {
          setError('Google Maps nativo solo funciona en dispositivos reales o emuladores.');
          setLoading(false);
          // Fallback para web: podrías cargar Google Maps JS API aquí
        }
      } catch (err) {
        console.error('Error inicializando mapa:', err);
        setError('Error al inicializar el mapa. Verifica tu conexión y permisos.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (newMapRef.current) {
        newMapRef.current.removeAllMapListeners();
        newMapRef.current.destroy();
        newMapRef.current = null;
      }
    };
  }, []);

  const getCurrentPosition = async () => {
    try {
      const status = await Geolocation.checkPermissions();
      
      if (status.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error('Permisos de ubicación no concedidos');
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({ 
        enableHighAccuracy: true,
        timeout: 10000 // 10 segundos de timeout
      });
      
      setCurrentPosition({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
      setError(null);
    } catch (err) {
      console.error('Error al obtener ubicación:', err);
      setError('No se pudo obtener tu ubicación. Por favor activa los permisos de ubicación.');
      setLoading(false);
      
      // Posición de fallback (por ejemplo, centro de una ciudad)
      setCurrentPosition({
        lat: 19.4326, // Ejemplo: Ciudad de México
        lng: -99.1332
      });
    }
  };

  const createMap = async (position: { lat: number; lng: number }) => {
    if (!mapRef.current) {
      setError('Elemento del mapa no encontrado');
      setLoading(false);
      return;
    }

    try {
      // IMPORTANTE: Reemplaza con tu API Key real
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBu9hngQxBD3jQumhck1qM8EswburgCnuY';
      
      if (!apiKey || apiKey === 'AIzaSyBu9hngQxBD3jQumhck1qM8EswburgCnuY') {
        throw new Error('API Key de Google Maps no configurada');
      }

      const newMap = await GoogleMap.create({
        id: 'com.una.trabajo',
        element: mapRef.current,
        apiKey: apiKey,
        config: {
          center: position,
          zoom: 15,
        },
        forceCreate: true
      });

      await newMap.addMarker({
        coordinate: position,
        title: 'Estás aquí',
      });

      newMapRef.current = newMap;
      setLoading(false);
    } catch (e) {
      console.error('Error al crear el mapa:', e);
      setError('Error al cargar el mapa. Verifica: 1) Tu API key, 2) Conexión a internet, 3) Que Google Play Services esté instalado (Android)');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPosition && mapRef.current) {
      createMap(currentPosition);
    }
  }, [currentPosition]);

  const handleCenterMap = async () => {
    if (newMapRef.current && currentPosition) {
      try {
        await newMapRef.current.setCamera({
          coordinate: currentPosition,
          zoom: 15,
          animate: true
        });
      } catch (err) {
        console.error('Error al centrar mapa:', err);
        setError('Error al centrar el mapa');
      }
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    await getCurrentPosition();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mapa</IonTitle>
          {currentPosition && (
            <IonButton slot="end" onClick={handleCenterMap}>
              Centrar
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <IonSpinner name="crescent" />
            <p style={{ marginLeft: '10px' }}>Cargando mapa...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '20px',
            textAlign: 'center'
          }}>
            <IonAlert
              isOpen={!!error}
              onDidDismiss={() => setError(null)}
              header="Error"
              message={error}
              buttons={[
                {
                  text: 'Reintentar',
                  handler: handleRetry
                },
                {
                  text: 'OK',
                  role: 'cancel'
                }
              ]}
            />
          </div>
        )}

        <div
          ref={mapRef as React.RefObject<HTMLDivElement>}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: currentPosition && !error ? 1 : 0
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Mapa;
