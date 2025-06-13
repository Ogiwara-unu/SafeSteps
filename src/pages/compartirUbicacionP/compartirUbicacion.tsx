import React, { useState, useEffect } from "react";
import { ShareLocation } from "../../components/location/compartirLocalizacion/ShareLocation";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import "./compartirUbicacion.css";
import Sidebar from "../../components/SideBar/SideBar";
import Topbar from "../../components/TopBar/TopBar";
import {
  IonPage,
  IonContent
} from "@ionic/react";

interface Usuario {
  id: string;
  displayName: string;
  email?: string;
}

export const CompartirUbi: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const db = getFirestore();
      const usuariosCol = collection(db, "users");
      const usuariosSnap = await getDocs(usuariosCol);
      const usuariosList = usuariosSnap.docs.map(doc => {
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
  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
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
              {usuarios.map(u => (
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