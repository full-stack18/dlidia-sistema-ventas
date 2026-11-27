'use client';
import * as jwtDecodeModule from 'jwt-decode';
import { useEffect, useState } from 'react';
import { socket } from '../../lib/socket';
import AdminNav from '../../components/AdminNav';
import PaginacionPedidos from '../../components/PaginacionPedidos';
import { API_URL } from '@/lib/api';
import type {
  HistorialEstadoPedido,
  Motorizado,
  Pedido
} from '../../types/pedido';
import PedidoCard from '../../components/PedidoCard';


const obtenerFechaLima = (fecha: Date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(fecha);

  const formatearFechaPedido = (fecha: string) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(fecha));

export default function PanelAdministrativo() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const LIMITE_POR_PAGINA = 20;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalPedidos / LIMITE_POR_PAGINA)
  );
  const [autorizado, setAutorizado] = useState(true);
  const [motorizados, setMotorizados] = useState<Motorizado[]>([]);
  const [esAdministradora, setEsAdministradora] = useState(false);
  const [motorizadoSeleccionado, setMotorizadoSeleccionado] = useState<Record<number, string>>({});
  const [fechaDesde, setFechaDesde] = useState(obtenerFechaLima());
  const [fechaHasta, setFechaHasta] = useState(obtenerFechaLima());
  const [errorRango, setErrorRango] = useState('');
  const [ventasTotales, setVentasTotales] = useState(0);
  const [historialPedidoAbierto, setHistorialPedidoAbierto] = useState<number | null>(null);
  const [historialPedido, setHistorialPedido] = useState<HistorialEstadoPedido[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (!token) {
      setAutorizado(false);
      return;
    }

    let esAdmin = false;

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);

      if (decoded.rol === 'Motorizado') {
        setAutorizado(false);
        return;
      }

      esAdmin = decoded.rol === 'Administradora';
      setEsAdministradora(esAdmin);
    } catch (error) {
      setAutorizado(false);
      return;
    }
    

    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem('dlidia_token');
        if (fechaDesde > fechaHasta) {
          setErrorRango('La fecha inicial no puede ser posterior a la fecha final.');
          setPedidos([]);
          return;
        }
        setErrorRango('');
        const res = await fetch(
          `${API_URL}/api/pedidos?desde=${fechaDesde}&hasta=${fechaHasta}&pagina=${pagina}&limite=${LIMITE_POR_PAGINA}`,
          {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const data = await res.json();

        if (!res.ok || !Array.isArray(data.items)) {
          console.error('No se pudo cargar la página de pedidos:', data);
          setPedidos([]);
          setTotalPedidos(0);
          return;
        }

        setPedidos(data.items);
        setTotalPedidos(Number(data.total) || 0);         
      } catch (error) {
        console.error("Error de conexión al cargar historial:", error);
        setPedidos([]);
      }
    };
    cargarHistorial();

    if (esAdmin) {
      const cargarMotorizados = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pedidos/motorizados`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const data = await res.json();

          if (res.ok && Array.isArray(data)) {
            setMotorizados(data);
          } else {
            console.error('No se pudieron cargar los motorizados:', data);
          }
        } catch (error) {
          console.error('Error al cargar motorizados:', error);
        }
      };

      cargarMotorizados();
    }

  }, [fechaDesde, fechaHasta, pagina]);

  useEffect(() => {
  const token = localStorage.getItem('dlidia_token');
  if (!token) return;

  try {
    const decoded: any = (jwtDecodeModule as any).jwtDecode(token);

    if (!['Administradora', 'Cajero', 'Cocina'].includes(decoded.rol)) {
      return;
    }
  } catch {
    return;
  }

  socket.connect();

  // Observer: reacciona a eventos emitidos por el servidor.
  socket.on('nuevo_pedido', (pedidoNuevo) => {
    setPedidos((prev) => [pedidoNuevo, ...prev]);
  });

  socket.on('estado_actualizado', (pedidoActualizado) => {
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido
      )
    );
  });

  return () => {
    socket.off('nuevo_pedido');
    socket.off('estado_actualizado');
    socket.disconnect();
  };
}, []);

  useEffect(() => {
    let activo = true;

    const cargarCajaDelDia = async () => {
      const token = localStorage.getItem('dlidia_token');

      if (!token) return;

      try {
        const res = await fetch(
          `${API_URL}/api/pedidos/caja/resumen-diario`,
          {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar la caja del día');
        }

        if (activo) {
          setVentasTotales(Number(data.total) || 0);
        }
      } catch (error) {
        console.error('Error al cargar la caja del día:', error);
      }
    };

    cargarCajaDelDia();

    const intervalo = window.setInterval(cargarCajaDelDia, 60_000);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    const token = localStorage.getItem('dlidia_token');

    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'No se pudo actualizar el estado del pedido.');
        return;
      }

      setPedidos((actuales) =>
        actuales.map((pedido) => (pedido.id === id ? data : pedido))
      );
    } catch (error) {
      alert('Error de conexión al actualizar el estado.');
    }
  };

  const abrirHistorialPedido = async (pedidoId: number) => {
    if (historialPedidoAbierto === pedidoId) {
      setHistorialPedidoAbierto(null);
      setHistorialPedido([]);
      setErrorHistorial('');
      return;
    }

    setHistorialPedidoAbierto(pedidoId);
    setHistorialPedido([]);
    setErrorHistorial('');
    setCargandoHistorial(true);

    const token = localStorage.getItem('dlidia_token');

    if (!token) {
      setErrorHistorial('Tu sesión expiró. Inicia sesión nuevamente.');
      setCargandoHistorial(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/pedidos/${pedidoId}/historial`,
        {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cargar el historial.');
      }

      if (!Array.isArray(data)) {
        throw new Error('La API devolvió un historial con formato inesperado.');
      }

      setHistorialPedido(data);
    } catch (error) {
      setErrorHistorial(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar el historial.'
      );
    } finally {
      setCargandoHistorial(false);
    }
  };

  const anularPedido = async (pedidoId: number) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas anular el pedido #${pedidoId}? Esta acción quedará registrada.`
    );

    if (!confirmar) return;

    await cambiarEstado(pedidoId, 'Cancelado');
  };

  const asignarMotorizado = async (pedidoId: number) => {
    const motorizadoId = motorizadoSeleccionado[pedidoId];

    if (!motorizadoId) {
      alert('Selecciona un motorizado antes de asignar el pedido.');
      return;
    }

    const token = localStorage.getItem('dlidia_token');

    if (!token) {
      alert('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/asignar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          motorizadoId: Number(motorizadoId)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'No se pudo asignar el motorizado.');
        return;
      }

      setPedidos((actuales) =>
        actuales.map((pedido) =>
          pedido.id === pedidoId ? data : pedido
        )
      );

      setMotorizadoSeleccionado((actual) => ({
        ...actual,
        [pedidoId]: ''
      }));
    } catch (error) {
      alert('Error de conexión al asignar el motorizado.');
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


  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <AdminNav />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-600">Dashboard Administrativo - D' Lidia</h1>
        <div className="bg-green-600 text-white px-6 py-2 rounded shadow-lg text-xl font-bold">
          Caja del día: S/ {ventasTotales.toFixed(2)}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
          Desde
          <input
            type="date"
            value={fechaDesde}
            max={fechaHasta}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
          Hasta
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        {errorRango && (
          <p className="text-sm font-semibold text-red-600">{errorRango}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.map((pedido) => (
          <PedidoCard
            key={pedido.id}
            pedido={pedido}
            esAdministradora={esAdministradora}
            motorizados={motorizados}
            motorizadoSeleccionado={motorizadoSeleccionado[pedido.id]}
            historialAbierto={historialPedidoAbierto === pedido.id}
            historial={historialPedido}
            cargandoHistorial={cargandoHistorial}
            errorHistorial={errorHistorial}
            formatearFecha={formatearFechaPedido}
            onCambiarEstado={cambiarEstado}
            onSeleccionarMotorizado={(pedidoId, motorizadoId) =>
              setMotorizadoSeleccionado((actual) => ({
                ...actual,
                [pedidoId]: motorizadoId
              }))
            }
            onAsignarMotorizado={asignarMotorizado}
            onAbrirHistorial={abrirHistorialPedido}
            onAnularPedido={anularPedido}
          />
        ))}
      </div>
      <PaginacionPedidos
        pagina={pagina}
        totalPaginas={totalPaginas}
        totalPedidos={totalPedidos}
        onCambiarPagina={setPagina}
      />
    </div>
  );
}
