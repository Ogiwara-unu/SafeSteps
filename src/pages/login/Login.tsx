import { useState } from 'react';
import { getDocs, collection, query, where, doc, setDoc } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { useHistory } from 'react-router-dom';
import { auth, googleProvider, db } from '../../firebaseConfig';
import { createOrUpdateUserDocument } from '../../firebase/createOrUpdateUser';

import './Login.css'; // Importamos el CSS externo

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
        history.push('/home');
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
      history.push('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const goToRegister = () => {
    history.push('/register');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="../assets/Imagotipo.png" alt="Logo" className="logo" />

        <h2 className="login-title">Bienvenido de nuevo</h2>
        <p className="login-subtitle">Inicia sesión con tu cuenta para continuar usando nuestros servicios.</p>

        <label className='label-field'>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />

        <label className='label-field'>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        <button className="login-button" onClick={handleCustomLogin}>Iniciar Sesión</button>

        <div className="login-footer-row">
          <button className="google-button-inline" onClick={handleGoogleLogin}>
            Iniciar sesión con Google
          </button>
          <span className="separator">|</span>
          <button className="register-button-inline" onClick={goToRegister}>
            Registrarse
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {userData && (
          <div className="success-box">
            <p>Bienvenido, {userData.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}
