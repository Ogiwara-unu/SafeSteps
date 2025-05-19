import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { UserData } from '../models/User';

const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createOrUpdateUserDocument = async (
  user: User,
  provider: 'password' | 'google', password?: string
): Promise<string | undefined> => {
  if (!user.email || !user.uid) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const token = generateToken();

  if (!userSnap.exists()) {
    const newUser: UserData = {
      uid: user.uid,
      email: user.email,
      provider,
      createdAt: new Date(),
      displayName: user.displayName || '',
      trustedContacts: [],
      password: password || '', // Por si es cuenta de Google
      token,
    };
    await setDoc(userRef, newUser);
  } else {
    await setDoc(userRef, { token }, { merge: true });
  }

  return token;
};
