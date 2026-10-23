'use client';

import { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import * as jwtDecodeModule from 'jwt-decode';
import { API_URL } from '@/lib/api';

type Numero = number | string;

interface Analisis {
  resumen: {
    ingresos_confirmados: Numero;
    pedidos_pagados: Numero;
    ticket_promedio: Numero;
  };
  ventasPorDia: {
    fecha: string;
    total: Numero;
    pedidos: number;
  }[];
  platosMasVendidos: {
    nombre: string;
    cantidad_vendida: number;
    ingresos_generados: Numero;
  }[];
  pagosPorMetodo: {
    metodo_pago: string;
    pedidos: number;
    total: Numero;
  }[];
  ventasPorModalidad: {
    tipo_entrega: string;
    origen: string;
    pedidos: number;
    total: Numero;
  }[];
  horasConMasVentas: {
    hora: number;
    pedidos: number;
    total: Numero;
  }[];
  anulaciones: {
    pedidos_anulados: number;
    monto_anulado: Numero;
  };
}

const obtenerHoyLima = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

const restarDias = (fecha: string, dias: number) => {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() - dias);
  return resultado.toISOString().slice(0, 10);
};

const soles = (valor: Numero) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(Number(valor) || 0);

const mostrarFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short'
  });

export default function AnaliticaPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dlidia_token');

    if (!token) {
      setAutorizado(false);
      setCargando(false);
      return;
    }

    try {
      const decoded: any = (jwtDecodeModule as any).jwtDecode(token);

      if (decoded.rol !== 'Administradora') {
        setAutorizado(false);
        setCargando(false);
        return;
      }

      const hoy = obtenerHoyLima();

      setDesde(restarDias(hoy, 29));
      setHasta(hoy);
      setAutorizado(true);
    } catch {
      setAutorizado(false);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (autorizado !== true || !desde || !hasta || desde > hasta) {
      return;
    }

    let cancelado = false;

    const cargarAnalisis = async () => {
      setCargando(true);
      setError('');

      try {
        const token = localStorage.getItem('dlidia_token');

        const res = await fetch(
          `${API_URL}/api/analitica/resumen?desde=${desde}&hasta=${hasta}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar el análisis');
        }

        if (!cancelado) {
          setAnalisis(data);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar el análisis'
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarAnalisis();

    return () => {
      cancelado = true;
    };
  }, [autorizado, desde, hasta]);

  if (autorizado === false) {
    return (
      <div className="p-8 text-center font-bold text-red-700">
        Acceso denegado. Solo la Administradora puede consultar este panel.
      </div>
    );
  }

  const maxVentaDia = Math.max(
    1,
    ...(analisis?.ventasPorDia.map((item) => Number(item.total)) ?? [])
  );

  const maxPlato = Math.max(
    1,
    ...(analisis?.platosMasVendidos.map((item) => item.cantidad_vendida) ?? [])
  );

  const maxMetodo = Math.max(
    1,
    ...(analisis?.pagosPorMetodo.map((item) => Number(item.total)) ?? [])
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-10 font-sans">
      <div className="p-5 md:p-8">
        <AdminNav />

        <div className="mx-auto mt-8 max-w-7xl">
          <header className="mb-6">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              Administración
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
              Panel de análisis
            </h1>
            <p className="mt-2 text-gray-600">
              Revisa ventas, productos, pagos y anulaciones del periodo.
            </p>
          </header>

          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
            <label className="flex flex-col gap-2 font-semibold text-gray-700">
              Desde
              <input
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2 font-semibold text-gray-700">
              Hasta
              <input
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <p className="text-sm text-gray-500 sm:pb-2">
              El panel muestra los últimos 30 días al abrirse.
            </p>
          </section>

          {desde > hasta && (
            <p className="mb-5 rounded-lg bg-red-50 p-4 font-medium text-red-700">
              La fecha inicial no puede ser posterior a la fecha final.
            </p>
          )}

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 p-4 font-medium text-red-700">
              {error}
            </p>
          )}

          {cargando && (
            <p className="mb-5 rounded-lg bg-white p-5 text-gray-600 shadow-sm">
              Cargando análisis...
            </p>
          )}

          {analisis && (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl bg-gradient-to-br from-green-600 to-green-800 p-5 text-white shadow">
                  <p className="text-sm font-semibold text-green-100">
                    Ingresos confirmados
                  </p>
                  <p className="mt-2 text-3xl font-extrabold">
                    {soles(analisis.resumen.ingresos_confirmados)}
                  </p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">
                    Pedidos pagados
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">
                    {analisis.resumen.pedidos_pagados}
                  </p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500">
                    Ticket promedio
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-700">
                    {soles(analisis.resumen.ticket_promedio)}
                  </p>
                </article>

                <article className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-red-700">
                    Pedidos anulados
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-red-800">
                    {analisis.anulaciones.pedidos_anulados}
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Monto asociado: {soles(analisis.anulaciones.monto_anulado)}
                  </p>
                </article>
              </section>

              <section className="mb-6 grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-extrabold text-gray-900">
                    Ventas por día
                  </h2>

                  {analisis.ventasPorDia.length === 0 ? (
                    <p className="text-gray-500">No hay ventas en este rango.</p>
                  ) : (
                    <div className="space-y-3">
                      {analisis.ventasPorDia.map((item) => (
                        <div key={item.fecha}>
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span className="font-medium text-gray-700">
                              {mostrarFecha(item.fecha)}
                            </span>
                            <span className="font-bold text-gray-900">
                              {soles(item.total)} · {item.pedidos} pedidos
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-green-600"
                              style={{
                                width: `${(Number(item.total) / maxVentaDia) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-extrabold text-gray-900">
                    Platos más vendidos
                  </h2>

                  {analisis.platosMasVendidos.length === 0 ? (
                    <p className="text-gray-500">No hay platos vendidos en este rango.</p>
                  ) : (
                    <div className="space-y-4">
                      {analisis.platosMasVendidos.map((plato) => (
                        <div key={plato.nombre}>
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span className="font-semibold text-gray-800">
                              {plato.nombre}
                            </span>
                            <span className="text-right text-gray-600">
                              {plato.cantidad_vendida} unidades ·{' '}
                              {soles(plato.ingresos_generados)}
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-red-600"
                              style={{
                                width: `${
                                  (plato.cantidad_vendida / maxPlato) * 100
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>

              <section className="mb-6 grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-extrabold text-gray-900">
                    Ingresos por método de pago
                  </h2>

                  {analisis.pagosPorMetodo.length === 0 ? (
                    <p className="text-gray-500">No hay pagos en este rango.</p>
                  ) : (
                    <div className="space-y-4">
                      {analisis.pagosPorMetodo.map((item) => (
                        <div key={item.metodo_pago}>
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span className="font-semibold text-gray-800">
                              {item.metodo_pago}
                            </span>
                            <span className="text-gray-600">
                              {item.pedidos} pedidos · {soles(item.total)}
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${(Number(item.total) / maxMetodo) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-extrabold text-gray-900">
                    Ventas por modalidad y origen
                  </h2>

                  {analisis.ventasPorModalidad.length === 0 ? (
                    <p className="text-gray-500">No hay datos en este rango.</p>
                  ) : (
                    <div className="space-y-3">
                      {analisis.ventasPorModalidad.map((item, index) => (
                        <div
                          key={`${item.tipo_entrega}-${item.origen}-${index}`}
                          className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-3"
                        >
                          <div>
                            <p className="font-bold text-gray-800">
                              {item.tipo_entrega}
                            </p>
                            <p className="text-sm text-gray-500">{item.origen}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {soles(item.total)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.pedidos} pedidos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-lg font-extrabold text-gray-900">
                  Horas con más ventas
                </h2>
                <p className="mb-4 text-sm text-gray-500">
                  Se ordenan por cantidad de pedidos pagados.
                </p>

                {analisis.horasConMasVentas.length === 0 ? (
                  <p className="text-gray-500">No hay ventas en este rango.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {analisis.horasConMasVentas.slice(0, 8).map((item) => (
                      <div
                        key={item.hora}
                        className="rounded-xl bg-amber-50 p-4"
                      >
                        <p className="text-sm font-semibold text-amber-800">
                          {String(item.hora).padStart(2, '0')}:00 h
                        </p>
                        <p className="mt-1 text-xl font-extrabold text-gray-900">
                          {item.pedidos} pedidos
                        </p>
                        <p className="text-sm text-gray-600">
                          {soles(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <p className="mt-5 text-xs text-gray-500">
                Los ingresos consideran pagos confirmados. Las anulaciones se
                muestran aparte y no se descuentan porque el sistema todavía no
                registra devoluciones.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}