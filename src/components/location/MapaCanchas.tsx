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
  const [contactLocations, setContactLocations] = useState<{lat: number, lng: number, displayName: string}[]>([]);

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

  /*
  useEffect(() => {
    const fetchContactLocations = async () => {
      const db = getFirestore();
      const auth = getAuth();
      const myUid = auth.currentUser?.uid;
      if (!myUid) return;
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("trustedContacts", "array-contains", myUid));
      const snap = await getDocs(q);
      const locations = snap.docs
        .map(doc => {
          const data = doc.data();
          if (data.location && data.displayName) {
            return {
              lat: data.location.latitude,
              lng: data.location.longitude,
              displayName: data.displayName
            };
          }
          return null;
        })
        .filter(Boolean) as {lat: number, lng: number, displayName: string}[];
      setContactLocations(locations);
    };
    fetchContactLocations();
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    // Renderiza los puntos de tus contactos
    contactLocations.forEach(async (loc) => {
      try {
        const ids = await mapInstance.current!.addMarkers([
          {
            coordinate: { lat: loc.lat, lng: loc.lng },
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            title: loc.displayName, // Esto muestra el nombre al hacer tap
          }
        ]);
        // Opcional: puedes mostrar un label flotante con el nombre usando un overlay o infoWindow si tu librería lo permite
      } catch {}
    });
  }, [contactLocations, mapReady]);
  */

  // Eliminado el efecto de login que llamaba a loadMarkers()

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
      } catch {}
      circleIds.current = [];
    }
  };

  const clearMarkers = async () => {
    if (mapInstance.current && Object.values(markerIds.current).length > 0) {
      try {
        await mapInstance.current.removeMarkers(Object.values(markerIds.current));
      } catch {}
      markerIds.current = {};
    }
  };

  const clearPolyline = async () => {
    if (mapInstance.current && trazoIdRef.current) {
      try {
        await mapInstance.current.removePolylines([trazoIdRef.current]);
      } catch {}
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
    } catch {}
  }

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
    } catch {}
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
      } catch {}
    }
  };

  // --- Renderizar marcadores ---
  // ...existing code...
const renderMarkers = async () => {
  if (!mapInstance.current) return;
  await clearMarkers();
  console.log("Markers a renderizar en el mapa:", markers);
  for (const marker of markers) {
    try {
      const iconUrl = marker.offline
        ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" // Amarillo para offline
        : selectedMarkers.includes(marker.id)
          ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
      const ids = await mapInstance.current.addMarkers([
        {
          coordinate: { lat: marker.lat, lng: marker.lng },
          iconUrl,
          title: marker.name,
          snippet: `Lat: ${marker.lat.toFixed(4)}, Lng: ${marker.lng.toFixed(4)}`
        }
      ]);
      markerIds.current[marker.id] = ids[0];
    } catch (error) {
      console.error("Error renderizando marcador:", error);
    }
  }
};
// ...existing code...

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

      // 2. Crear ruta temporal (línea recta) para visualización inmediata

      // 3. Obtener ruta optimizada de la API
      const polylineEncoded = await crearRutaSegura(puntos);

      if (!polylineEncoded) {
        console.error("No se obtuvo ruta de la API");
        return;
      }

      // 4. Eliminar ruta temporal

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

  const dibujarRutaSimple = async (puntos: { lat: number; lng: number }[]) => {
    if (!mapInstance.current || puntos.length < 2) return;

    await clearPolyline();

    const polylineId = await mapInstance.current.addPolylines([
      {
        path: puntos,
        strokeColor: "#00FF00", // Verde brillante para prueba
        strokeWeight: 6
      }
    ]);

    trazoIdRef.current = polylineId[0];
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
    // No llames a loadMarkers aquí, el listener lo hace
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
    // No llames a loadMarkers aquí, el listener lo hace
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
    } catch {}
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
    // loadMarkers(); // Eliminado: el listener ya sincroniza
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
      console.log("Markers que llegan desde el hook:", markers);
      renderMarkers();
    }
  }, [markers, mapReady]);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Botón de salir */}
      <IonButton
        color="danger"
        style={{ position: "absolute", bottom: 20, left: 20, zIndex: 2000 }}
        onClick={() => setShowExitConfirm(true)}
      >
        Salir
      </IonButton>

      <IonModal isOpen={showExitConfirm}>
        <div style={{ padding: 24, textAlign: "center" }}>
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
        <IonButton onClick={centerMapOnLocation} shape="round" size="small">
          <IonIcon icon={locateOutline} />
        </IonButton>
        <IonButton onClick={addCurrentLocationMarker} shape="round" size="small" color="warning">
          <IonIcon icon={pinOutline} />
        </IonButton>
        <IonButton onClick={() => dibujarRutaSeguraEnMapa(getSelectedMarkers())}>
          🛣️
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
          style={{ minWidth: 0, width: 36, height: 36, padding: 0 }}
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
            onClick={async () => {
              console.log("Iniciando creación de ruta...");
              const seleccionados = getSelectedMarkers();
              console.log("Puntos a enviar:", seleccionados);
              await dibujarRutaSeguraEnMapa(seleccionados);
              console.log("Proceso completado");
            }}
          >
            <IonIcon slot="start" icon={trailSignOutline} />
            Crear Ruta
          </IonButton>
        </div>
      )}

      {/* Lista de marcadores */}
      {showList && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
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
};

export default MapaCanchas;
