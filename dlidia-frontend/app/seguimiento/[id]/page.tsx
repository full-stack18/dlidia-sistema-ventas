'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { socket } from '../../../lib/socket';

interface EstadoPedido {
  id: number;
  estado: string;
  tipo_entrega: string;
  total: number;
  fecha_creacion: string;
  detalles: DetallePedido[];
}

interface DetallePedido {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

const PASOS_DELIVERY = [
  "Pendiente",
  "En Preparación",
  "Listo",
  "Asignado",
  "Recogido",
  "En camino",
  "Entregado",
];

const PASOS_SIN_DELIVERY = [
  "Pendiente",
  "En Preparación",
  "Listo",
  "Entregado",
];

export default function SeguimientoPedido() {
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<EstadoPedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    const cargarEstadoInicial = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pedidos/estado/${id}`);

        if (!activo) return;

        if (res.ok) {
          const data = await res.json();
          if (activo) setPedido(data);
        } else {
          if (activo) setError('No encontramos ese pedido.');
        }
      } catch {
        if (activo) setError('Error de conexión al consultar tu pedido.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    const actualizarSeguimiento = (pedidoActualizado: {
      id: number;
      estado: string;
      tipo_entrega: string;
    }) => {
      if (String(pedidoActualizado.id) !== String(id)) return;

      setPedido((anterior) =>
        anterior
          ? {
              ...anterior,
              estado: pedidoActualizado.estado,
              tipo_entrega: pedidoActualizado.tipo_entrega
            }
          : anterior
      );
    };

    const unirseAlSeguimiento = () => {
      socket.emit(
        'seguir_pedido',
        id,
        (respuesta: {
          ok: boolean;
          pedido?: {
            estado: string;
            tipo_entrega: string;
          };
        }) => {
          if (!activo || !respuesta?.ok || !respuesta.pedido) return;

          setPedido((anterior) =>
            anterior
              ? {
                  ...anterior,
                  estado: respuesta.pedido!.estado,
                  tipo_entrega: respuesta.pedido!.tipo_entrega
                }
              : anterior
          );
        }
      );
    };

    socket.on('estado_publico_actualizado', actualizarSeguimiento);
    socket.on('connect', unirseAlSeguimiento);
    socket.connect();

    // Si el socket ya estaba conectado, unirse de inmediato a la sala.
    if (socket.connected) {
      unirseAlSeguimiento();
    }

    cargarEstadoInicial();

    return () => {
      activo = false;
      socket.off('estado_publico_actualizado', actualizarSeguimiento);
      socket.off('connect', unirseAlSeguimiento);
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

const pasosPedido =
  pedido.tipo_entrega === "Delivery"
    ? PASOS_DELIVERY
    : PASOS_SIN_DELIVERY;

const pasoActual = pasosPedido.indexOf(pedido.estado);
const pedidoCancelado = pedido.estado === 'Cancelado';
const esperandoMotorizado =
  pedido.tipo_entrega === "Delivery" &&
  pedido.estado === "Listo";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f5f2] px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl rounded-2xl border-t-8 border-[#7A1010] bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center mb-8">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-wide">Pedido</p>
          <h1 className="text-4xl font-extrabold text-[#1a1210]">#{pedido.id}</h1>
        </div>

        {pedidoCancelado ? (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-xl font-extrabold text-red-700">
              Pedido cancelado
            </p>
            <p className="mt-2 text-sm text-red-600">
              Este pedido fue anulado y ya no continuará en preparación ni entrega.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-8">
            {pasosPedido.map((paso, i) => (
              <div key={paso} className="relative flex min-w-0 flex-1 flex-col items-center">
                {i > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-1 -z-10 ${
                      i <= pasoActual ? 'bg-[#DCA11D]' : 'bg-gray-200'
                    }`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i <= pasoActual
                      ? 'bg-[#DCA11D] text-[#1a1210]'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < pasoActual ? '✓' : i + 1}
                </div>

                <p
                  className={`mx-auto mt-2 min-h-10 w-full max-w-18 px-1 whitespace-normal break-normal text-center text-[10px] font-bold leading-tight ${
                    i <= pasoActual ? 'text-[#1a1210]' : 'text-gray-400'
                  }`}
                >
                  {paso}
                </p>
              </div>
            ))}
          </div>
        )}

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

        {pedido.detalles?.length > 0 && (
          <div className="border-t border-dashed border-gray-300 pt-4 mb-4">
            <p className="text-xs text-gray-400 font-bold uppercase mb-2">Detalle del pedido</p>
            <ul className="space-y-2">
              {pedido.detalles.map((detalle, indice) => (
                <li key={`${detalle.nombre}-${indice}`} className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#1a1210]">
                    {detalle.cantidad}x {detalle.nombre}
                  </span>
                  <span className="font-bold text-gray-600">
                    S/ {Number(detalle.subtotal).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
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
