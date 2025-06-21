import { db } from '../firebaseConfig';
import { disableNetwork, enableNetwork } from 'firebase/firestore';

export class FirebaseService {
  private static isOffline = false;

  static async toggleNetwork() {
    try {
      this.isOffline = !this.isOffline;
      if (this.isOffline) {
        await disableNetwork(db);
        console.log("Modo offline activado");
      } else {
        await enableNetwork(db);
        console.log("Modo online activado");
      }
      return this.isOffline;
    } catch (error) {
      console.error("Error al cambiar el estado de red de Firestore:", error);
      return this.isOffline;
    }
  }

  static async forceOnline() {
    try {
      if (this.isOffline) {
        await enableNetwork(db);
        this.isOffline = false;
        console.log("Modo online forzado");
      }
      return this.isOffline;
    } catch (error) {
      console.error("Error al forzar modo online:", error);
      return this.isOffline;
    }
  }

  static async forceOffline() {
    try {
      if (!this.isOffline) {
        await disableNetwork(db);
        this.isOffline = true;
        console.log("Modo offline forzado");
      }
      return this.isOffline;
    } catch (error) {
      console.error("Error al forzar modo offline:", error);
      return this.isOffline;
    }
  }
}

export default FirebaseService;