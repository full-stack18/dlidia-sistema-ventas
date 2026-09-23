'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as jwtDecodeModule from 'jwt-decode';

export default function AdminNav() {
  const router = useRouter();
  const [rol, setRol] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (token) {
      try {
        // Leemos el contenido del token para saber el rol del usuario
        const decoded: any = (jwtDecodeModule as any).jwtDecode(token);
        setRol(decoded.rol);
        setNombre(decoded.username);
      } catch (error) {
        console.error("Error decodificando token", error);
      }
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('dlidia_token');
    router.push('/login');
  };

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md mb-6 rounded-xl flex justify-between items-center">
      <div className="flex gap-6 items-center">
        <span className="font-bold text-red-500 text-xl tracking-wider mr-4">D' LIDIA</span>
        
        {/* El Motorizado NUNCA debe ver estos enlaces */}
        {rol !== 'Motorizado' && (
          <>
            <Link href="/cocina" className="hover:text-red-400 font-bold transition flex items-center gap-2">
              📋 Panel de Pedidos
            </Link>
            <Link href="/caja" className="hover:text-red-400 font-bold transition flex items-center gap-2">
              💰 Cuadre de Caja
            </Link>
          </>
        )}
        
        {/* Solo la Dueña (Administradora) puede ver este enlace */}
        {rol === 'Administradora' && (
          <Link href="/admin" className="hover:text-red-400 font-bold transition flex items-center gap-2">
            🍔 Mantenimiento de Carta
          </Link>
        )}

        {/* Enlace para el Motorizado */}
        {rol === 'Motorizado' && (
          <span className="text-blue-400 font-bold flex items-center gap-2">
            🛵 Ruta Activa
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm hidden md:inline">Usuario: <strong className="text-white">{nombre}</strong> ({rol})</span>
        <button 
          onClick={cerrarSesion} 
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded font-bold transition shadow"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}