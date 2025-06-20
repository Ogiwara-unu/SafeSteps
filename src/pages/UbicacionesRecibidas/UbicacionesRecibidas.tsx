import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "../../components/SideBar/SideBar"; 
import Topbar from "../../components/TopBar/TopBar";
import { IonPage, IonContent } from "@ionic/react";
import "./UbicacionesRecibidas.css";

interface Ubicacion {
  id: string;
  from: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: any;
}

const UbicacionesRecibidasPage: React.FC = () => {
  const { user } = useAuth();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    const ref = collection(db, "users", user.uid, "sharedLocations");

    const unsub = onSnapshot(ref, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ubicacion[];
      setUbicaciones(datos);
    });

    return () => unsub();
  }, [user]);

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <Topbar />
        <IonContent className="ubicaciones-recibidas-content">
          <div className="ubicaciones-recibidas-container">
            <h2 className="ubicaciones-titulo">Ubicaciones Compartidas</h2>
            {ubicaciones.length === 0 ? (
              <p className="ubicaciones-mensaje">No hay ubicaciones compartidas contigo aún.</p>
            ) : (
              <ul className="ubicaciones-lista">
                {ubicaciones.map((ubi) => (
                  <li className="ubicacion-item" key={ubi.id}>
                    <p><strong>De:</strong> {ubi.from}</p>
                    <p><strong>Lat:</strong> {ubi.location?.latitude}</p>
                    <p><strong>Lng:</strong> {ubi.location?.longitude}</p>
                    <p><strong>Fecha:</strong>{" "}
                      {ubi.timestamp?.seconds
                        ? new Date(ubi.timestamp.seconds * 1000).toLocaleString()
                        : "No disponible"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default UbicacionesRecibidasPage;
