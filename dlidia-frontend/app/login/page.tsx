'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Guardamos el token en la memoria del navegador
        localStorage.setItem('dlidia_token', data.token);
        
        // 2. Redirigimos según el rol del empleado
        if (data.usuario.rol === 'Motorizado') {
          router.push('/motorizado');
        } else {
          router.push('/cocina'); // Cajero, Admin o Cocina van al Dashboard
        }
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-red-600 text-center mb-2">D' Lidia</h1>
        <p className="text-center text-gray-500 mb-6 font-bold">Acceso para Personal</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-bold">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 text-gray-900"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition mt-4"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}