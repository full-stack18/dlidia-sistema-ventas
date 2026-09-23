'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { socket } from '../../../lib/socket';
import { API_URL } from '@/lib/api';

interface EstadoPedido {
  id: number;
  estado: string;
  tipo_entrega: string;
  total: number;
  fecha_creacion: string;
}

const PASOS = ['Pendiente', 'En Preparación', 'Entregado'];

export default function SeguimientoPedido() {
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<EstadoPedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarEstado = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pedidos/estado/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPedido(data);
        } else {
          setError('No encontramos ese pedido.');
        }
      } catch (err) {
        setError('Error de conexión al consultar tu pedido.');
      } finally {
        setCargando(false);
      }
    };
    cargarEstado();

    socket.connect();
    socket.on('estado_actualizado', (pedidoActualizado) => {
      if (String(pedidoActualizado.id) === String(id)) {
        setPedido(pedidoActualizado);
      }
    });

    return () => {
      socket.off('estado_actualizado');
      socket.disconnect();
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f2]">
        <p className="text-gray-500 font-bold animate-pulse">Consultando tu pedido...</p>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f5f2] gap-4 px-4 text-center">
        <p className="text-red-600 font-bold text-xl">{error || 'Pedido no encontrado'}</p>
        <Link href="/" className="text-[#7A1010] font-bold underline">Volver al inicio</Link>
      </div>
    );
  }

  const pasoActual = PASOS.indexOf(pedido.estado);
  const esperandoMotorizado = pedido.tipo_entrega === 'Delivery' && pedido.estado === 'En Preparación';

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border-t-8 border-[#7A1010] max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-wide">Pedido</p>
          <h1 className="text-4xl font-extrabold text-[#1a1210]">#{pedido.id}</h1>
        </div>

        <div className="flex items-center justify-between mb-8">
          {PASOS.map((paso, i) => (
            <div key={paso} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${i <= pasoActual ? 'bg-[#DCA11D]' : 'bg-gray-200'}`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${i <= pasoActual ? 'bg-[#DCA11D] text-[#1a1210]' : 'bg-gray-200 text-gray-400'}`}
              >
                {i < pasoActual ? '✓' : i + 1}
              </div>
              <p className={`text-xs font-bold mt-2 text-center ${i <= pasoActual ? 'text-[#1a1210]' : 'text-gray-400'}`}>
                {paso}
              </p>
            </div>
          ))}
        </div>

        {esperandoMotorizado && (
          <p className="text-center text-blue-600 font-bold bg-blue-50 rounded-lg py-3 mb-6">
            🛵 Tu pedido está listo, esperando al motorizado para salir a entrega.
          </p>
        )}

        {pedido.estado === 'Entregado' && (
          <p className="text-center text-green-700 font-bold bg-green-50 rounded-lg py-3 mb-6">
            ✅ ¡Pedido entregado! Gracias por tu compra.
          </p>
        )}

        <div className="border-t border-dashed border-gray-300 pt-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Tipo de entrega</p>
            <p className="font-bold text-[#1a1210]">{pedido.tipo_entrega}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
            <p className="font-extrabold text-[#7A1010] text-2xl">S/ {Number(pedido.total).toFixed(2)}</p>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center mt-6 text-sm font-bold text-gray-500 hover:text-[#7A1010]"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}