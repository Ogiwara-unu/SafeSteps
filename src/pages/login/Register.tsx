import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useHistory } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth,  googleProvider} from '../../firebaseConfig';
import { createOrUpdateUserDocument } from '../../firebase/createOrUpdateUser';

import './Login'; // usa el mismo CSS del login

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const history = useHistory();

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      await createOrUpdateUserDocument(userCredential.user, 'password', password,phoneNumber);

      history.push('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };
    const goToLogin = () => {
    history.push('/login');
  };
   const handleGoogleLogin = async () => {
      setError('');
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const token = await createOrUpdateUserDocument(user, 'google');
        const phoneNumber = user.phoneNumber || '';
        const fullUser = {
          email: user.email,
          uid: user.uid,
          provider: 'google',
          phoneNumber,
          token,
        };
        setUserData(fullUser);
        history.push('/home');
      } catch (err: any) {
        setError(err.message);
      }
    };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="../assets/Imagotipo.png" alt="Logo" className="logo" />

        <h2 className="login-title">¡Bienvenido!</h2>
        <p className="login-subtitle">¿Aún no tienes cuenta? Regístrate y empieza a disfrutar de todos nuestros servicios.</p>
        <label className='label-field'>Nombre</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-field"
        />
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

        <label className='label-field'>Número de telefono</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input-field"
        />

        <button onClick={handleRegister} className="login-button">
          Registrarse
        </button>

        {error && <p className="error-message">{error}</p>}

       <div className="login-footer-row">
          <button className="google-button-inline" onClick={handleGoogleLogin}>
            Registrarse con Google
          </button>
          <span className="separator">|</span>
          <button className="register-button-inline" onClick={goToLogin}>
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
