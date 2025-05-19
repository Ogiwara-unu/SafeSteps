import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useHistory } from 'react-router-dom'; 
import { auth } from '../../firebaseConfig';
import { createOrUpdateUserDocument } from '../../firebase/createOrUpdateUser';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const history = useHistory(); 

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      await createOrUpdateUserDocument(userCredential.user, 'password', password);

      history.push('/login'); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Registro</h2>
      <input
        type="text"
        placeholder="Nombre completo"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="border p-2 w-full"
      />
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
      <button onClick={handleRegister} className="bg-blue-500 text-white p-2 rounded w-full">
        Registrarse
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
