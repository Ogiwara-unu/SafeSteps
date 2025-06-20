import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { createOrUpdateUserDocument } from '../../firebase/createOrUpdateUser';
import { signInWithGoogleCapacitor } from '../../firebase/firebaseAuthService';

import './Login.css';

export default function CustomLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const history = useHistory();

  const handleCustomLogin = async () => {
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await createOrUpdateUserDocument(user, 'password', password);
      const fullUser = {
        email: user.email,
        uid: user.uid,
        provider: 'password',
        token,
      };
      setUserData(fullUser);
      history.push('/home');
    } catch (err: any) {
      // Permitir acceso si hay usuario autenticado en caché (modo offline)
      if (auth.currentUser) {
        setUserData({
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          provider: 'password',
          token: null,
        });
        history.push('/home');
        return;
      }
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Usuario no encontrado');
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta');
      else setError('Error al iniciar sesión');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithGoogleCapacitor();
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
      // Permitir acceso si hay usuario autenticado en caché (modo offline)
      if (auth.currentUser) {
        setUserData({
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          provider: 'google',
          token: null,
        });
        history.push('/home');
        return;
      }
      console.error(err);
      setError('Error al iniciar sesión con Google');
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

        <label className="label-field">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />

        <label className="label-field">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        <button className="login-button" onClick={handleCustomLogin}>Iniciar sesión</button>

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
