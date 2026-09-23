'use client';
import { useEffect, useState } from 'react';
import { socket } from '../../lib/socket';

interface Pedido {
  id: number;
  origen: string;
  total: number;
  estado: string;
}

export default function MotorizadoApp() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [autorizado, setAutorizado] = useState(true);

  useEffect(() => {
    const cargarRuta = async () => {
      const token = localStorage.getItem('dlidia_token');
      if (!token) {
        setAutorizado(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/pedidos/delivery', {
          headers: {
            'Authorization': `Bearer ${token}` // Enviamos el pase VIP
          }
        });
        
        const data = await res.json();
        if (res.ok) {
          setPedidos(data);
        } else {
          setAutorizado(false);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    cargarRuta();

    // 2. Escuchar cambios (por si la cocina marca un delivery como preparado)
    socket.connect();
    socket.on('estado_actualizado', (pedidoActualizado) => {
      if (pedidoActualizado.tipo_entrega === 'Delivery') {
        setPedidos(prev => {
          const existe = prev.find(p => p.id === pedidoActualizado.id);
          if (existe) {
            return prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p).filter(p => p.estado !== 'Entregado');
          } else if (pedidoActualizado.estado === 'En Preparación') {
             return [...prev, pedidoActualizado];
          }
          return prev;
        });
      }
    });

    return () => {
      socket.off('estado_actualizado');
      socket.disconnect();
    };
  }, []);

  const marcarEntregado = async (id: number) => {
    const token = localStorage.getItem('dlidia_token');
    await fetch(`http://localhost:3001/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: 'Entregado' })
    });
    setPedidos(prev => prev.filter(p => p.id !== id));
  };

  if (!autorizado) {
    return <div className="p-8 text-center text-red-600 font-bold">Acceso Denegado. Por favor, inicie sesión.</div>;
  }

  const cerrarSesion = () => {
    localStorage.removeItem('dlidia_token');
    window.location.href = '/login';
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-10">
      <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold">App Motorizado</h1>
          <p className="text-sm text-blue-100">Ruta de entregas D' Lidia</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {pedidos.length === 0 ? (
          <div className="text-center mt-10 text-gray-500">
            <span className="text-4xl block mb-2">🛵</span>
            <p>No tienes pedidos pendientes de entrega.</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold">Pedido #{pedido.id}</h2>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                  {pedido.estado}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Cobrar: <strong className="text-green-600 text-base">S/ {Number(pedido.total).toFixed(2)}</strong></p>
              
              <button 
                onClick={() => marcarEntregado(pedido.id)}
                className="mt-4 w-full bg-green-500 text-white py-3 rounded-lg font-bold text-lg active:bg-green-600 shadow"
              >
                Confirmar Entrega
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}