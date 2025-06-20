import { db } from '../firebaseConfig';
import { disableNetwork, enableNetwork } from 'firebase/firestore';  

export class FirebaseService {
  private static isOffline = false;

  static async toggleNetwork() {
    this.isOffline = !this.isOffline;
    
    if (this.isOffline) {
      await disableNetwork(db);
      console.log("Modo offline activado");
    } else {
      await enableNetwork(db);
      console.log("Modo online activado");
    }
    return this.isOffline;
  }

  static async forceOnline() {
    await enableNetwork(db);
    this.isOffline = false;
  }

  static async forceOffline() {
    await disableNetwork(db);
    this.isOffline = true;
  }
}

export default FirebaseService;