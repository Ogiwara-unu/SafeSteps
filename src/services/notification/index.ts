import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const savePushToken = async (token: string,uid: string) => {
  try {
    await setDoc(doc(db, "deviceTokens", uid), {
      token: token,
      updatedAt: new Date(),
    });    
  } catch (error) {
    alert("❌ Error al guardar token: "+ error);
  }
};


 export const loadUserPreferences = async (token: string) => {
    try {
      const userDocRef = doc(db, "userPreferences", token);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const subscribedTopics = snap.data().topics || [];
        
        return subscribedTopics;
      }
      return [];
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };
  

export const saveUserPreferences = async (token: string, topics: string[]) => {
  try {
    const userDocRef = doc(db, "userPreferences", token);
    await setDoc(userDocRef, { topics: topics, lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
}
