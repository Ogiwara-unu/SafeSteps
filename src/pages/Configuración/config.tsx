import { useEffect, useState } from "react";
import { IonText, IonPage, IonContent } from "@ionic/react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useHistory } from "react-router";
import "./config.css";

import Topbar from "../../components/TopBar/TopBar";
import Sidebar from "../../components/SideBar/SideBar";

export const MostrarDatosUsuario = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        history.push("/config"); // Redirige a la página principal o deseada
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [history]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      history.push("/login")// Redirige al login después de cerrar sesión
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <Topbar />
        <IonContent>
          <IonText className="usuario-container">
            {loading ? (
              <p>Cargando datos del usuario...</p>
            ) : user ? (
              <>
                <div className="avatar"></div>
                <h2>{user.displayName || "Usuario"}</h2>
                <p><span>Usuario: </span>{user.email}</p>
                <p><span>UID: </span>{user.uid}</p>
                <button className="cerrar-sesion" onClick={handleSignOut}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <p>No hay ningún usuario autenticado.</p>
            )}
          </IonText>
        </IonContent>
      </IonPage>
    </>
  );
};
