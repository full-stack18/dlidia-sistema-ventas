'use client';
import * as jwtDecodeModule from 'jwt-decode';
import { useEffect, useState } from 'react';
import { socket } from '../../lib/socket';
import AdminNav from '../../components/AdminNav';
import { API_URL } from '@/lib/api';

interface Pedido {
  id: number;
  origen: string;
  tipo_entrega: string;
  total: number;
  estado: string;
}

export default function PanelAdministrativo() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [autorizado, setAutorizado] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (!token) {
      setAutorizado(false);
      return;
    }

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);
      if (decoded.rol === 'Motorizado') {
        setAutorizado(false);
        return;
      }
    } catch (error) {
      setAutorizado(false);
      return;
    }

    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem('dlidia_token');
        const res = await fetch(`${API_URL}/api/pedidos`, {
          cache: 'no-store',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (Array.isArray(data)) {
          setPedidos(data);
        } else {
          console.error("El backend devolvió un error en lugar de un arreglo:", data);
          setPedidos([]);
        }
      } catch (error) {
        console.error("Error de conexión al cargar historial:", error);
        setPedidos([]);
      }
    };
    cargarHistorial();

    socket.connect();
    socket.on('nuevo_pedido', (pedidoNuevo) => {
      setPedidos((prev) => [pedidoNuevo, ...prev]);
    });

    socket.on('estado_actualizado', (pedidoActualizado) => {
      setPedidos((prev) =>
        prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p)
      );
    });

    return () => {
      socket.off('nuevo_pedido');
      socket.off('estado_actualizado');
      socket.disconnect();
    };
  }, []);

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    const token = localStorage.getItem('dlidia_token');
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'No se pudo actualizar el estado del pedido.');
      }
    } catch (error) {
      alert('Error de conexión al actualizar el estado.');
    }
  };

  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-600 font-bold text-xl mb-4">Acceso Denegado</p>
          <p className="text-gray-600 mb-6">Esta es una zona restringida para el personal de D' Lidia.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const ventasTotales = pedidos
    .filter(p => p.estado === 'Entregado')
    .reduce((sum, p) => sum + Number(p.total), 0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <AdminNav />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-600">Dashboard Administrativo - D' Lidia</h1>
        <div className="bg-green-600 text-white px-6 py-2 rounded shadow-lg text-xl font-bold">
          Caja del día: S/ {ventasTotales.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className={`p-4 rounded shadow-md border-l-4 bg-white
            ${pedido.estado === 'Pendiente' ? 'border-red-500' :
              pedido.estado === 'En Preparación' ? 'border-yellow-500' : 'border-green-500 opacity-60'}`}>

            <div className="flex justify-between border-b pb-2 mb-2">
              <h2 className="text-xl font-bold">Pedido #{pedido.id}</h2>
              <span className="font-bold text-gray-500">{pedido.estado}</span>
            </div>

            <p className="text-gray-600">Origen: {pedido.origen}</p>
            <p className="text-gray-600">Entrega: {pedido.tipo_entrega}</p>
            <p className="font-bold text-green-600 mt-2 text-lg">Total: S/ {Number(pedido.total).toFixed(2)}</p>

            <div className="mt-4 flex gap-2">
              {pedido.estado === 'Pendiente' && (
                <button onClick={() => cambiarEstado(pedido.id, 'En Preparación')} className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 font-bold">
                  Preparar
                </button>
              )}
              {pedido.estado === 'En Preparación' && pedido.tipo_entrega !== 'Delivery' && (
                <button onClick={() => cambiarEstado(pedido.id, 'Entregado')} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 font-bold">
                  Cobrar / Entregar
                </button>
              )}
              {pedido.estado === 'En Preparación' && pedido.tipo_entrega === 'Delivery' && (
                <p className="w-full text-center text-blue-600 font-bold py-2 bg-blue-50 rounded">
                  🛵 Esperando recojo del motorizado
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}