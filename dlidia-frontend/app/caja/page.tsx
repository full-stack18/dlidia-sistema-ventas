'use client';
import { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import * as jwtDecodeModule from 'jwt-decode';
import { API_URL } from '@/lib/api';

interface Venta {
  id: number;
  origen: string;
  tipo_entrega: string;
  total: number;
  metodo_pago: string;
  fecha_creacion: string;
  detalles: DetalleVenta[]; 
}

interface PedidoPendiente {
  id: number;
  estado: string;
  origen: string;
  tipo_entrega: string;
  total: number | string;
  fecha_creacion: string;
  detalles: DetalleVenta[];
}

interface DetalleVenta {
  id: number;
  nombre: string;
  cantidad: number;
  subtotal: number;
}

interface CierreCaja {
  fecha_cierre: string;
  monto_esperado: number | string;
  monto_contado: number | string;
  diferencia: number | string;
  observacion: string | null;
}

const obtenerFechaLocal = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  };

export default function CuadreCaja() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>([]);
  const [metodosSeleccionados, setMetodosSeleccionados] = useState<Record<number, string>>({});
  const [pedidoCobrando, setPedidoCobrando] = useState<number | null>(null);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);  
  const [total, setTotal] = useState(0);
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [autorizado, setAutorizado] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [montoContado, setMontoContado] = useState('');
  const [observacionCierre, setObservacionCierre] = useState('');
  const [cerrandoCaja, setCerrandoCaja] = useState(false);
  const [cierreRegistrado, setCierreRegistrado] = useState<CierreCaja | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (!token) {
      setAutorizado(false);
      return;
    }

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);
      if (decoded.rol !== 'Cajero' && decoded.rol !== 'Administradora') {
        setAutorizado(false);
        return;
      }
    } catch (error) {
      setAutorizado(false);
      return;
    }

    cargarCaja();
    cargarPedidosPendientes();
  }, [fecha]);

  const cargarCaja = async () => {
    setCargando(true);
    const token = localStorage.getItem('dlidia_token');
    try {
      const res = await fetch(`${API_URL}/api/pedidos/caja?fecha=${fecha}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setVentas(data.ventas);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error al cargar la caja:", error);
    } finally {
      setCargando(false);
    }
  };


  const cargarPedidosPendientes = async () => {
    setCargandoPendientes(true);
    const token = localStorage.getItem('dlidia_token');

    try {
      const res = await fetch(
        `${API_URL}/api/pedidos/caja/pendientes-pago`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudieron cargar los pedidos pendientes');
      }

      setPedidosPendientes(data);
    } catch (error) {
      console.error('Error al cargar pedidos pendientes:', error);
    } finally {
      setCargandoPendientes(false);
    }
  };

  const registrarPago = async (pedidoId: number) => {
  const token = localStorage.getItem('dlidia_token');

  if (!token) {
    alert('Tu sesión expiró. Inicia sesión nuevamente.');
    return;
  }

  const metodoPago = metodosSeleccionados[pedidoId] || 'Efectivo';

  setPedidoCobrando(pedidoId);

  try {
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/pagos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metodoPago })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'No se pudo registrar el pago');
    }

    await cargarPedidosPendientes();
    await cargarCaja();

    alert('Pago registrado correctamente.');
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : 'Ocurrió un error al registrar el pago'
    );
  } finally {
    setPedidoCobrando(null);
  }
};
  
const registrarCierre = async () => {
  const token = localStorage.getItem('dlidia_token');

  if (!token) {
    alert('Tu sesión expiró. Inicia sesión nuevamente.');
    return;
  }

  if (fecha !== obtenerFechaLocal()) {
    alert('Solo puedes cerrar la caja de la fecha actual.');
    return;
  }

  if (montoContado.trim() === '' || !Number.isFinite(Number(montoContado)) || Number(montoContado) < 0) {
    alert('Ingresa un monto contado válido, mayor o igual a cero.');
    return;
  }

  setCerrandoCaja(true);

  try {
    const res = await fetch(`${API_URL}/api/pedidos/caja/cierre`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        montoContado: Number(montoContado),
        observacion: observacionCierre
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'No se pudo registrar el cierre de caja');
    }

    setCierreRegistrado(data.cierre);
    alert('Cierre de caja registrado correctamente.');
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Ocurrió un error al cerrar la caja');
  } finally {
    setCerrandoCaja(false);
  }
};

  if (!autorizado) {
    return <div className="p-8 text-center text-red-600 font-bold">Acceso Denegado. Solo personal de Caja.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans pb-10">
      <div className="p-8">
        <AdminNav />

        <div className="max-w-6xl mx-auto mt-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Cuadre de Caja</h1>
              <p className="text-gray-500 font-medium">Revisión de ingresos diarios</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="font-bold text-gray-700">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-2 border-gray-300 rounded-lg p-2 font-bold text-gray-800 focus:border-red-600 focus:ring-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-lg text-white transform transition hover:scale-105">
              <h3 className="text-green-100 font-bold mb-1">Ingresos Totales (S/)</h3>
              <p className="text-4xl font-extrabold">S/ {total.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 font-bold mb-1">Total de Pedidos</h3>
              <p className="text-4xl font-extrabold text-gray-900">{ventas.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 font-bold mb-1">Ticket Promedio</h3>
              <p className="text-4xl font-extrabold text-blue-600">
                S/ {ventas.length > 0 ? (total / ventas.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              Cierre de caja
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Ingresa el efectivo que contaste físicamente. El sistema lo comparará
              con los pagos en efectivo confirmados de hoy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                Efectivo contado (S/)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoContado}
                  onChange={(e) => setMontoContado(e.target.value)}
                  placeholder="Ejemplo: 150.00"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                Observación (opcional)
                <input
                  type="text"
                  value={observacionCierre}
                  onChange={(e) => setObservacionCierre(e.target.value)}
                  placeholder="Ejemplo: Todo conforme"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
            </div>

            {fecha !== obtenerFechaLocal() && (
              <p className="mt-3 text-sm text-amber-700">
                Seleccionaste otra fecha. El cierre solo se registra para hoy.
              </p>
            )}

            <button
              type="button"
              onClick={registrarCierre}
              disabled={cerrandoCaja || cierreRegistrado !== null || fecha !== obtenerFechaLocal()}
              className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cerrandoCaja
                ? 'Registrando cierre...'
                : cierreRegistrado
                  ? 'Caja cerrada'
                  : 'Registrar cierre de caja'}
            </button>

            {cierreRegistrado && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-gray-800">
                <p className="font-bold text-green-800">Cierre registrado</p>
                <p>Monto esperado en efectivo: S/ {Number(cierreRegistrado.monto_esperado).toFixed(2)}</p>
                <p>Monto contado: S/ {Number(cierreRegistrado.monto_contado).toFixed(2)}</p>
                <p className="font-bold">
                  Diferencia: S/ {Number(cierreRegistrado.diferencia).toFixed(2)}
                </p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">
              Pedidos pendientes de pago
            </h2>

            {cargandoPendientes ? (
              <p className="text-gray-500">Cargando pedidos pendientes...</p>
            ) : pedidosPendientes.length === 0 ? (
              <p className="text-gray-500">No hay pedidos pendientes de pago.</p>
            ) : (
              <div className="space-y-4">
                {pedidosPendientes.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-200 rounded-xl p-4"
                  >
                    <div>
                      <p className="font-bold text-gray-900">Pedido #{pedido.id}</p>
                      <p className="text-sm text-gray-500">
                        {pedido.tipo_entrega} · Estado: {pedido.estado}
                      </p>
                      <p className="font-extrabold text-green-700">
                        S/ {Number(pedido.total).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                        <span>Método de pago</span>

                        <select
                          value={metodosSeleccionados[pedido.id] || 'Efectivo'}
                          onChange={(e) =>
                            setMetodosSeleccionados((actuales) => ({
                              ...actuales,
                              [pedido.id]: e.target.value
                            }))
                          }
                          className="min-w-[180px] rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900 font-semibold focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
                          style={{ color: '#111827', backgroundColor: '#ffffff', opacity: 1 }}
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape</option>
                          <option value="Plin">Plin</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </label>

                      <button
                        onClick={() => registrarPago(pedido.id)}
                        disabled={pedidoCobrando === pedido.id}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-wait disabled:opacity-60"
                        style={{
                          height: '44px',
                          minHeight: '44px',
                          width: 'auto',
                          padding: '0 16px',
                          fontSize: '15px',
                          lineHeight: '20px'
                        }}
                      >
                        {pedidoCobrando === pedido.id
                          ? 'Registrando...'
                          : 'Registrar pago'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
            {cargando ? (
              <div className="p-10 text-center text-gray-500 font-bold animate-pulse">Consultando base de datos...</div>
            ) : ventas.length === 0 ? (
              <div className="p-10 text-center text-gray-500 font-medium">No hay ventas registradas para esta fecha.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                    <th className="p-4 font-bold">ID Pedido</th>
                    <th className="p-4 font-bold">Hora</th>
                    <th className="p-4 font-bold">Tipo Entrega</th>
                    <th className="p-4 font-bold">Origen</th>
                    <th className="p-4 font-bold">Método de pago</th>
                    <th className="p-4 font-bold">Productos</th>
                    <th className="p-4 font-bold text-right">Total (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">#{venta.id}</td>
                      <td className="p-4 text-gray-600">{new Date(venta.fecha_creacion).toLocaleTimeString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          venta.tipo_entrega === 'Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {venta.tipo_entrega}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{venta.origen}</td>
                      <td className="p-4 text-gray-600">{venta.metodo_pago}</td>
                      <td className="p-4 text-gray-600 min-w-52">
                        {venta.detalles?.length > 0 ? (
                          <ul className="space-y-1">
                            {venta.detalles.map((detalle) => (
                              <li key={detalle.id} className="text-sm">
                                {detalle.cantidad}x {detalle.nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs italic text-gray-400">Sin detalle histórico</span>
                        )}
                      </td>
                      <td className="p-4 font-extrabold text-green-600 text-right">S/ {Number(venta.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
