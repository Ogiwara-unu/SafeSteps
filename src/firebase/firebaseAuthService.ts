import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export async function signInWithGoogleCapacitor() {
  const result = await FirebaseAuthentication.signInWithGoogle();

  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('No se pudo obtener el token de Google');

  const credential = GoogleAuthProvider.credential(idToken);
  const firebaseUser = await signInWithCredential(auth, credential);

  return firebaseUser;
}
