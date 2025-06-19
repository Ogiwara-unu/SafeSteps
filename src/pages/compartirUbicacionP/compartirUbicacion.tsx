import React, { useState, useEffect } from "react";
import { ShareLocation } from "../../components/location/compartirLocalizacion/ShareLocation";
import { getFirestore, collection, getDocs, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import "./compartirUbicacion.css";
import Sidebar from "../../components/SideBar/SideBar";
import Topbar from "../../components/TopBar/TopBar";
import { IonPage, IonContent } from "@ionic/react";

interface Usuario {
  id: string;
  displayName: string;
  email?: string;
}

export const CompartirUbi: React.FC = () => {
  const { user, loading } = useAuth(); // ✅ hook en la raíz del componente
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [ubicacionesRecibidas, setUbicacionesRecibidas] = useState<any[]>([]);

  // Obtener usuarios para la lista
  useEffect(() => {
    const fetchUsuarios = async () => {
      const db = getFirestore();
      const usuariosCol = collection(db, "users");
      const usuariosSnap = await getDocs(usuariosCol);
      const usuariosList = usuariosSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || data.email || "Sin nombre",
          email: data.email,
        };
      }) as Usuario[];
      setUsuarios(usuariosList);
    };
    fetchUsuarios();
  }, []);

  // Escuchar ubicaciones compartidas conmigo
  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    console.log("Usuario autenticado:", user);

    const ref = collection(db, "users", user.uid, "sharedLocations");
    const unsub = onSnapshot(ref, (snapshot) => {
      const ubicaciones = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Ubicaciones recibidas:", ubicaciones);
      setUbicacionesRecibidas(ubicaciones);
    });

    return () => unsub();
  }, [user]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <Topbar />
        <IonContent className="compartir-ubi-content">
          <div className="compartir-ubi-container">
            <h3>Selecciona personas para compartir tu ubicación:</h3>
            <ul className="compartir-ubi-list">
              {usuarios.map((u) => (
                <li key={u.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(u.id)}
                      onChange={() => toggleSeleccion(u.id)}
                    />
                    {u.displayName}
                  </label>
                </li>
              ))}
            </ul>

            {/* Ubicaciones compartidas contigo */}
            <div style={{ margin: "24px 0" }}>
              <h4>Ubicaciones que han compartido contigo:</h4>
              {ubicacionesRecibidas.length === 0 ? (
                <div style={{ color: "#888" }}>Nadie ha compartido ubicación contigo aún.</div>
              ) : (
                <ul>
                  {ubicacionesRecibidas.map((ubi) => (
                    <li key={ubi.id}>
                      <strong>De:</strong> {ubi.from} <br />
                      <strong>Lat:</strong> {ubi.location?.latitude} <br />
                      <strong>Lng:</strong> {ubi.location?.longitude} <br />
                      <strong>Fecha:</strong>{" "}
                      {ubi.timestamp instanceof Date
                        ? ubi.timestamp.toLocaleString()
                        : ubi.timestamp?.toDate
                        ? ubi.timestamp.toDate().toLocaleString()
                        : ubi.timestamp?.seconds
                        ? new Date(ubi.timestamp.seconds * 1000).toLocaleString()
                        : "Fecha no disponible"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ShareLocation
              userIds={seleccionados}
              buttonClass="compartir-ubi-btn"
              messageClass="compartir-ubi-msg"
            />
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default CompartirUbi;
