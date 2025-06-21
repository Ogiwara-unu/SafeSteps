import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "@capacitor/google-maps";
import { IonSpinner, IonText, IonButton, IonIcon, IonModal } from "@ionic/react";
import { useLocationTracker } from "../../hooks/locations/useLocationTracker";
import { locateOutline, pinOutline, listOutline, closeOutline } from "ionicons/icons";
import { useMarkers } from "../../hooks/markers/useMarkers";
import { MarkerModal } from "./MarkerModal";
import { MarkerList } from "./MarkerList";
import { crearRutaSegura, decodePolyline } from "../../hooks/rutas/rutaSegura";
import { radioButtonOnOutline, trailSignOutline } from "ionicons/icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import Sidebar from "../SideBar/SideBar";
import { notificarContactosDeConfianza } from "../../services/notification/notificarContactos";
import { warningOutline, logOutOutline } from 'ionicons/icons';




const MapaCanchas: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const circleIds = useRef<string[]>([]);
  const markerIds = useRef<{ [id: string]: string }>({});
  const trazoIdRef = useRef<string | null>(null); // Referencia para la ruta dibujada

  const { location, loading, startTracking, stopTracking, requestPermissions } = useLocationTracker();
  const [mapReady, setMapReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [markerName, setMarkerName] = useState("");
  const [editingMarker, setEditingMarker] = useState<any | null>(null);
  const [showList, setShowList] = useState(false);
  const [mapClean, setMapClean] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [contactLocations, setContactLocations] = useState<{ lat: number, lng: number, displayName: string }[]>([]);

  const [sharedLocations, setSharedLocations] = useState<
    { lat: number; lng: number; from: string; timestamp?: any }[]
  >([]);


  // Hook para marcadores
  const { markers, selectedMarkers, toggleMarkerSelection, addMarker, deleteMarker, updateMarker } = useMarkers();


  const getSelectedMarkers = () => {
    const seleccionados = markers.filter(m => selectedMarkers.includes(m.id));
    console.log("Marcadores seleccionados:", seleccionados);
    return seleccionados;
  };





  const dibujarRutaEntreSeleccionados = async () => {
    const seleccionados = getSelectedMarkers();
    if (seleccionados.length === 2) {
      await dibujarRutaSeguraEnMapa(seleccionados);
    }
  };


  useEffect(() => {
    if (selectedMarkers.length === 2) {
      dibujarRutaEntreSeleccionados();
    } else {
      clearPolyline();
    }
  }, [selectedMarkers]);


  // --- Funciones para limpiar elementos del mapa ---
  const clearCircles = async () => {
    if (mapInstance.current && circleIds.current.length > 0) {
      try {
        await mapInstance.current.removeCircles(circleIds.current);
      } catch { }
      circleIds.current = [];
    }
  };

  const clearMarkers = async () => {
    if (mapInstance.current && Object.values(markerIds.current).length > 0) {
      try {
        await mapInstance.current.removeMarkers(Object.values(markerIds.current));
      } catch { }
      markerIds.current = {};
    }
  };

  const clearPolyline = async () => {
    if (mapInstance.current && trazoIdRef.current) {
      try {
        await mapInstance.current.removePolylines([trazoIdRef.current]);
      } catch { }
      trazoIdRef.current = null;
    }
  };

  // --- Crear mapa ---
  async function createMap() {
    if (!mapRef.current || mapInstance.current) return;
    await clearCircles();
    await clearMarkers();
    await clearPolyline();
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
    } catch { }
  }

  /* -------------------------------------------------------------------------------------------------- */
  /* ---------------------------FUNCION PARA CARGAR UBIS COMPARTIDAS----------------------------------- */
  /* -------------------------------------------------------------------------------------------------- */
  const loadSharedLocations = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const db = getFirestore();
    const ref = collection(db, "users", user.uid, "sharedLocations");
    const q = query(ref, where("compartiendo", "==", true));
    const snap = await getDocs(q);
    const locations = snap.docs
      .map(doc => doc.data())
      .filter(d => d.location)
      .map(d => ({
        lat: d.location.latitude,
        lng: d.location.longitude,
        from: d.from,
        timestamp: d.timestamp
      }));
    setSharedLocations(locations);
    console.log("Ubicaciones compartidas cargadas:", locations);
  };

  useEffect(() => {
    loadSharedLocations();
    const interval = setInterval(loadSharedLocations, 10000); // refresca cada 10s
    return () => clearInterval(interval);
  }, []);
  // --- Actualizar círculos de ubicación ---
  const updateLocationCircles = async () => {
    if (!mapReady || !mapInstance.current || !location?.coords) return;
    if (location.coords.accuracy > 100) {
      await clearCircles();
      return;
    }
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
          strokeWeight: 1,
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
          strokeWeight: 1,
        },
      ]);
      circleIds.current = newCircleIds;
    } catch { }
  };
  // --- Centrar mapa en ubicación ---
  const centerMapOnLocation = async () => {
    if (mapInstance.current && location?.coords) {
      try {
        await mapInstance.current.setCamera({
          coordinate: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
          zoom: 15,
          animate: true,
        });
      } catch { }
    }
  };
  // --- Renderizar marcadores ---
  const renderMarkers = async () => {
    if (!mapInstance.current) return;
    await clearMarkers();
    // Marcadores propios
    for (const marker of markers) {
      try {
        const ids = await mapInstance.current.addMarkers([
          {
            coordinate: { lat: marker.lat, lng: marker.lng },
            iconUrl: selectedMarkers.includes(marker.id)
              ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
              : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            title: marker.name,
            snippet: `Lat: ${marker.lat.toFixed(4)}, Lng: ${marker.lng.toFixed(4)}`
          }
        ]);
        markerIds.current[marker.id] = ids[0];
      } catch (error) {
        console.error("Error renderizando marcador:", error);
      }
    }
    // Marcadores de ubicaciones compartidas
    for (const shared of sharedLocations) {
      try {
        const ids = await mapInstance.current.addMarkers([
          {
            coordinate: { lat: shared.lat, lng: shared.lng },
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            title: `Ubicación compartida`,
            snippet: `De: ${shared.from}\nLat: ${shared.lat.toFixed(4)}, Lng: ${shared.lng.toFixed(4)}`
          }
        ]);
        // No necesitas guardar el id si no vas a manipularlos individualmente
      } catch (error) {
        console.error("Error renderizando ubicación compartida:", error);
      }
    }
  };

  useEffect(() => {
    if (mapReady) {
      renderMarkers();
    }
  }, [selectedMarkers, mapReady, sharedLocations]);


  // --- Función para dibujar ruta segura en el mapa ---
  const dibujarRutaSeguraEnMapa = async (puntos: { lat: number; lng: number }[]) => {

    console.log("Iniciando dibujarRutaSeguraEnMapa con puntos:", puntos);

    if (!mapInstance.current) {
      console.error("El mapa no está inicializado");
      return;
    }

    if (puntos.length < 2) {
      console.error("Se necesitan al menos 2 puntos para crear una ruta");
      return;
    }

    try {
      // 1. Limpiar ruta anterior
      await clearPolyline();

      // 3. Obtener ruta optimizada de la API
      const polylineEncoded = await crearRutaSegura(puntos);

      if (!polylineEncoded) {
        console.error("No se obtuvo ruta de la API");
        return;
      }

      // 5. Dibujar ruta definitiva
      const puntosRuta = decodePolyline(polylineEncoded);
      const polylineId = await mapInstance.current.addPolylines([
        {
          path: puntosRuta,
          strokeColor: "#2E86DE", // Azul para ruta definitiva
          strokeWeight: 4,
          strokeOpacity: 1
        }
      ]);

      trazoIdRef.current = polylineId[0];
      console.log("Ruta dibujada con ID:", polylineId[0]);

    } catch (error) {
      console.error("Error completo al dibujar ruta:", error);
    }



  };

  // --- Handlers de modal y marcadores ---
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
    const marker = markers.find(m => m.id === id);
    if (marker) {
      await deleteMarker(marker.id, marker.name);
    }
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
  };

  const cleanUpMap = async () => {
    setMapClean(false);
    try {
      if (mapInstance.current) {
        await clearCircles();
        await clearMarkers();
        await clearPolyline();
        await mapInstance.current.destroy();
        mapInstance.current = null;
        setMapReady(false);
      }
    } catch { }
    finally {
      circleIds.current = [];
      markerIds.current = {};
      trazoIdRef.current = null;
      setMapClean(true);
    }
  };

  // --- Efectos ---
  useEffect(() => {
    requestPermissions();
    startTracking();
    return () => {
      stopTracking();
      cleanUpMap();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await cleanUpMap();
      if (isMounted && mapClean) {
        await createMap();
      }
    })();
    return () => {
      isMounted = false;
      cleanUpMap();
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !location?.coords || !mapClean) return;
    updateLocationCircles();
  }, [location, mapReady, mapClean]);

  useEffect(() => {
    if (mapReady && mapInstance.current) {
      renderMarkers();
    }
  }, [markers, mapReady]);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Botón de salir */}


      <IonButton
        size="small"
        shape="round"
        style={{
          '--background': '#65695b',
          width: '48px',
          height: '48px',
          minWidth: '36px',
          borderRadius: '50%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0',
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 1100
        }}
        title="Salir del mapa"
        onClick={() => setShowExitConfirm(true)}
      >
        <IonIcon icon={logOutOutline} color="light" />
      </IonButton>

      <IonModal isOpen={showExitConfirm}>
        <div style={{ padding: 24, textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <IonText color="danger">
            ¿Seguro que quieres salir? Se dejará de trackear tu ubicación.
          </IonText>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 16 }}>
            <IonButton color="medium" onClick={() => setShowExitConfirm(false)}>
              Cancelar
            </IonButton>
            <IonButton
              color="danger"
              onClick={async () => {
                await stopTracking();
                await cleanUpMap();
                setShowExitConfirm(false);
                window.history.back();
              }}
            >
              Salir
            </IonButton>
          </div>
        </div>
      </IonModal>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "row",
          gap: "8px",
        }}
      >

        <IonButton
          onClick={centerMapOnLocation}
          shape="round" size="small"
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            '--background': "#042940", // azul oscuro
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <IonIcon icon={locateOutline} />
        </IonButton>
        <IonButton
          onClick={addCurrentLocationMarker} shape="round" size="small"
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            '--background': "#65695b",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <IonIcon icon={pinOutline} />
        </IonButton>
        <IonButton
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            borderRadius: "50%",
            '--background': "#c4391d",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            padding: "0"
          }} shape="round" size="small"
          onClick={async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
              alert("Debes iniciar sesión para enviar alerta.");
              return;
            }
            if (!location?.coords) {
              alert("Ubicación no disponible.");
              return;
            }
            const mensaje = `¡AYUDA! Necesito asistencia urgente. Esta es una alerta enviada desde SafeSteps.\nUbicación: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
            await notificarContactosDeConfianza(
              user.uid,
              mensaje
            );
            alert("Notificación de ayuda enviada a tus contactos de confianza.");
          }}
        >
          <IonIcon icon={warningOutline} />
        </IonButton>
      </div>

      {/* Botón flotante para mostrar/ocultar la lista */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1100,
        }}
      >
        <IonButton
          size="small"
          shape="round"
          onClick={() => setShowList((v) => !v)}
          style={{
            minWidth: 0,
            width: '48px',
            height: '48px',
            padding: 0,
            position: 'absolute',
            top: '55px', // 50px debajo del botón anterior
            right: '4px',
            zIndex: 1100
          }}
          color="light"
        >
          <IonIcon icon={showList ? closeOutline : listOutline} />
        </IonButton>
      </div>
      {selectedMarkers.length === 2 && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '20px',
          zIndex: 1000
        }}>
          <IonButton
            style={{
              '--background': '#9ca38e' // color verde claro
            }}
            onClick={async () => {
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) {
                alert("Debes iniciar sesión para notificar.");
                return;
              }
              // Notifica a los contactos de confianza
              await notificarContactosDeConfianza(
                user.uid,
                "¡He iniciado una ruta! Si necesitas contactarme, hazlo ahora."
              );
              // Dibuja la ruta
              const seleccionados = getSelectedMarkers();
              await dibujarRutaSeguraEnMapa(seleccionados);
              alert("Notificación enviada a tus contactos de confianza.");
            }}
          >
            Iniciar ruta
          </IonButton>
        </div>
      )}

      {/* Lista de marcadores */}
      {showList && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '50px',
          paddingTop: '95px', // espacio para el botón de la lista
          zIndex: 1000
        }}>
          <MarkerList
            markers={markers}
            onEdit={handleEditMarker}
            onDelete={handleDeleteMarker}
            selectedMarkers={selectedMarkers}
            onToggleSelect={toggleMarkerSelection}
          />
        </div>
      )}
      {/* Modal para agregar/editar marcador */}
      <MarkerModal
        isOpen={showModal}
        initialName={markerName}
        onClose={() => {
          setShowModal(false);
          setEditingMarker(null);
        }}
        onSave={editingMarker ? handleUpdateMarker : handleSaveMarker}
        editing={!!editingMarker}
      />

      {loading && !location?.coords && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <IonSpinner name="crescent" color="primary" />
          <IonText color="primary">Obteniendo ubicación...</IonText>
        </div>
      )}
    </div>
  );
}
export default MapaCanchas;
