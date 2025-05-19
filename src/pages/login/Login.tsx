import { useState } from 'react';
import { getDocs, collection, query, where, doc, setDoc } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { useHistory } from 'react-router-dom'; // ✅ React Router v5 Es importante para redireccionar con use history, la V6 usa otro tipo

import { auth, googleProvider, db } from '../../firebaseConfig';
import { createOrUpdateUserDocument } from '../../firebase/createOrUpdateUser';

const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const history = useHistory(); 

  const handleCustomLogin = async () => {
    setError('');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Usuario no encontrado');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const user = userDoc.data();

      if (user.password === password) {
        const token = generateToken();
        await setDoc(doc(db, 'users', user.uid), { token }, { merge: true });
        const fullUser = { ...user, token };
        setUserData(fullUser);
        history.push('/home'); // ✅ redirige al home
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await createOrUpdateUserDocument(user, 'google');
      const fullUser = {
        email: user.email,
        uid: user.uid,
        provider: 'google',
        token,
      };
      setUserData(fullUser);
      history.push('/home'); // ✅ redirige al home
    } catch (err: any) {
      setError(err.message);
    }
  };

  const goToRegister = () => {
    history.push('/register');
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Iniciar Sesión</h2>

      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={handleCustomLogin}
        className="bg-blue-500 text-white p-2 rounded w-full"
      >
        Entrar con Email
      </button>

      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white p-2 rounded w-full"
      >
        Entrar con Google
      </button>

      {/* Botón para registrarse */}
      <button
        onClick={goToRegister}
        className="bg-gray-500 text-white p-2 rounded w-full"
      >
        ¿No tienes cuenta? Regístrate
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {userData && (
        <div className="bg-green-100 p-4 rounded">
          <p>Bienvenido, {userData.email}</p>
          <p>Proveedor: {userData.provider || 'email'}</p>
          <p>Token: {userData.token}</p>
        </div>
      )}
    </div>
  );
}
