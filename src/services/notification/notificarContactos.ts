import { getFirestore, doc, getDoc } from "firebase/firestore";
import { urlbase } from "../../models/constantes"; 

export const notificarContactosDeConfianza = async (uid: string, mensaje: string) => {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return;

  const trustedContacts: string[] = userDoc.data().trustedContacts || [];
  if (trustedContacts.length === 0) return;

  const tokens: string[] = [];
  for (const contactId of trustedContacts) {
    const tokenDoc = await getDoc(doc(db, "deviceTokens", contactId));
    if (tokenDoc.exists()) {
      const token = tokenDoc.data().token;
      if (token) tokens.push(token);
    }
  }

  if (tokens.length === 0) return;

  // Envía una notificación por cada token
  for (const token of tokens) {
    console.log("Tokens de las notificaciones: ",token);
    await fetch(`${urlbase}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, // ahora es string, no array
        title: "Alerta de ruta iniciada",
        body: mensaje,
      }),
    });
  }
};