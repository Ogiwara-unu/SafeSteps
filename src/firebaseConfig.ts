import { initializeApp } from "firebase/app";
import { getAuth , setPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";


const firebaseConfig = {
 apiKey:  import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket:  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId:  import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId:   import.meta.env.VITE_MEASUREMENT_ID || "",
   googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});
const messaging = getMessaging(app);
export const googleProvider = new GoogleAuthProvider();

const authReady = setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistencia configurada correctamente.");
  })
  .catch((error) => {
    console.error("Error al configurar la persistencia:", error);
  });
 
export { auth, db, messaging, authReady };