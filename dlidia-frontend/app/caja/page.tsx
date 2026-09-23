'use client';
import { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import * as jwtDecodeModule from 'jwt-decode';

interface Venta {
  id: number;
  origen: string;
  tipo_entrega: string;
  total: number;
  fecha_creacion: string;
}

const obtenerFechaLocal = () => {
    // Método 100% infalible: extraemos los números exactos del reloj de tu PC
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  };

export default function CuadreCaja() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [total, setTotal] = useState(0);
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [autorizado, setAutorizado] = useState(true);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');
    if (!token) {
      setAutorizado(false);
      return;
    }

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);
      // Solo Cajeros y Administradoras pueden ver la caja
      if (decoded.rol !== 'Cajero' && decoded.rol !== 'Administradora') {
        setAutorizado(false);
        return;
      }
    } catch (error) {
      setAutorizado(false);
      return;
    }

    cargarCaja();
  }, [fecha]);

  const cargarCaja = async () => {
    setCargando(true);
    const token = localStorage.getItem('dlidia_token');
    try {
      const res = await fetch(`http://localhost:3001/api/pedidos/caja?fecha=${fecha}`, {
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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