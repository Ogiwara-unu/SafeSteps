import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { ShareLocationButton } from "../../hooks/realTimeLocation/ShareLocationButton";
import "./compartirUbicacion.css";
import Sidebar from "../../components/SideBar/SideBar";
import Topbar from "../../components/TopBar/TopBar";
import { IonPage, IonContent } from "@ionic/react";
import { Modal } from "./Modal/Modal";

interface Usuario {
  id: string;
  displayName: string;
  email?: string;
  isTrusted?: boolean;
  wasTrusted?: boolean;
}

export const CompartirUbi: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // NUEVO

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      setLoading(true);
      const db = getFirestore();

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const currentTrusted = userData?.trustedContacts || [];

        setTrustedContacts(currentTrusted);

        const usersSnap = await getDocs(collection(db, "users"));
        const usersList = usersSnap.docs
          .filter((doc) => doc.id !== user.uid)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              displayName: data.displayName || data.email || "Usuario sin nombre",
              email: data.email,
              isTrusted: currentTrusted.includes(doc.id),
              wasTrusted: userData?.trustedContactsHistory?.some(
                (c: any) => c.userId === doc.id
              ),
            };
          });

        setAllUsers(usersList);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const toggleContact = async (userId: string) => {
    if (!user?.uid) return;

    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);

    try {
      if (trustedContacts.includes(userId)) {
        await setDoc(
          userRef,
          {
            trustedContacts: arrayRemove(userId),
            trustedContactsHistory: arrayUnion({
              userId,
              removedAt: new Date(),
            }),
          },
          { merge: true }
        );
        setTrustedContacts((prev) => prev.filter((id) => id !== userId));
      } else {
        await setDoc(
          userRef,
          {
            trustedContacts: arrayUnion(userId),
            trustedContactsHistory: arrayUnion({
              userId,
              addedAt: new Date(),
            }),
          },
          { merge: true }
        );
        setTrustedContacts((prev) => [...prev, userId]);
      }

      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isTrusted: !u.isTrusted,
                wasTrusted: true,
              }
            : u
        )
      );
    } catch (error) {
      console.error("Error al actualizar contactos:", error);
    }
  };

  const trustedUsers = allUsers.filter((u) => u.isTrusted);
  const historicalUsers = allUsers.filter((u) => !u.isTrusted && u.wasTrusted);
  const otherUsers = allUsers.filter((u) => !u.isTrusted && !u.wasTrusted);

  if (loading) {
    return (
      <>
        <Sidebar />
        <IonPage id="main-content">
          <Topbar />
          <IonContent className="compartir-ubi-content">
            <div className="loading">Cargando contactos...</div>
          </IonContent>
        </IonPage>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <IonPage id="main-content">
        <Topbar />
        <IonContent className="compartir-ubi-content">
          <div className="container">


            <h1>Mis Contactos</h1>

            {/* Sección de contactos actuales e históricos */}
            <div className="trusted-section">

              <div className="contacts-group">
            
                {trustedUsers.length > 0 ? (
                  <ul className="contacts-list">
                    {trustedUsers.map((user) => (
                      <li key={user.id} className="contact-item active">
                        <label>
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleContact(user.id)}
                          />
                          <span className="contact-name">{user.displayName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">No tienes contactos activos</p>
                )}

                {historicalUsers.length > 0 ? (
                  <ul className="contacts-list">
                    {historicalUsers.map((user) => (
                      <li key={user.id} className="contact-item historical">
                        <label>
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => toggleContact(user.id)}
                          />
                          <span className="contact-name">{user.displayName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">No hay contactos históricos</p>
                )}
              </div>
            </div>

            {/* Botón para compartir ubicación */}
            <div className="share-section">
              <ShareLocationButton
                userIds={trustedContacts}
                buttonClass="share-button"
              />
            </div>
          </div>
        </IonContent>
      </IonPage>

      {/* Botón flotante */}
      <button className="floating-add-button" onClick={() => setIsModalOpen(true)}>+</button>

      {/* Modal de todos los usuarios */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Agregar Usuarios</h2>
        {otherUsers.length > 0 ? (
          <ul className="contacts-list">
            {otherUsers.map((user) => (
              <li key={user.id} className="contact-item">
                <label>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleContact(user.id)}
                  />
                  <span className="contact-name">{user.displayName}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-message">No hay otros usuarios disponibles</p>
        )}
      </Modal>

    </>
  );
};
