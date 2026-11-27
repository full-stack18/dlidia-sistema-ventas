'use client';

import type {
  HistorialEstadoPedido,
  Motorizado,
  Pedido
} from '../types/pedido';

interface PedidoCardProps {
  pedido: Pedido;
  esAdministradora: boolean;
  motorizados: Motorizado[];
  motorizadoSeleccionado?: string;
  historialAbierto: boolean;
  historial: HistorialEstadoPedido[];
  cargandoHistorial: boolean;
  errorHistorial: string;
  formatearFecha: (fecha: string) => string;
  onCambiarEstado: (pedidoId: number, nuevoEstado: string) => void;
  onSeleccionarMotorizado: (
    pedidoId: number,
    motorizadoId: string
  ) => void;
  onAsignarMotorizado: (pedidoId: number) => void;
  onAbrirHistorial: (pedidoId: number) => void;
  onAnularPedido: (pedidoId: number) => void;
}

export default function PedidoCard({
  pedido,
  esAdministradora,
  motorizados,
  motorizadoSeleccionado,
  historialAbierto,
  historial,
  cargandoHistorial,
  errorHistorial,
  formatearFecha,
  onCambiarEstado,
  onSeleccionarMotorizado,
  onAsignarMotorizado,
  onAbrirHistorial,
  onAnularPedido
}: PedidoCardProps) {
  const colorEstado =
    pedido.estado === 'Pendiente' ? 'border-red-500' :
    pedido.estado === 'En Preparación' ? 'border-yellow-500' :
    pedido.estado === 'Listo' ? 'border-blue-500' :
    pedido.estado === 'Asignado' ? 'border-purple-500' :
    pedido.estado === 'Recogido' ? 'border-indigo-500' :
    pedido.estado === 'En camino' ? 'border-cyan-500' :
    pedido.estado === 'Cancelado' ? 'border-red-700' :
    'border-green-600';

  return (
    <article
      className={`rounded border-l-4 bg-white p-4 text-gray-800 shadow-md ${colorEstado}`}
    >
      <div className="mb-2 flex justify-between border-b pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Pedido #{pedido.id}
        </h2>
        <span className="font-bold text-gray-700">{pedido.estado}</span>
      </div>

      <p className="text-gray-600">Origen: {pedido.origen}</p>
      <p className="text-sm text-gray-500">
        Creado: {formatearFecha(pedido.fecha_creacion)}
      </p>
      <p className="text-gray-600">Entrega: {pedido.tipo_entrega}</p>

      {pedido.detalles?.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            Productos
          </p>
          <ul className="space-y-2">
            {pedido.detalles.map((detalle) => (
              <li
                key={detalle.id}
                className="flex justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {detalle.cantidad}x {detalle.nombre}
                  </p>
                  {detalle.observaciones && (
                    <p className="mt-1 text-xs text-gray-600">
                      Observación: {detalle.observaciones}
                    </p>
                  )}
                </div>
                <span className="font-bold text-gray-600">
                  S/ {Number(detalle.subtotal).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-2 text-lg font-bold text-green-600">
        Total: S/ {Number(pedido.total).toFixed(2)}
      </p>

      <div className="mt-4 flex gap-2">
        {pedido.estado === 'Pendiente' && (
          <button
            type="button"
            onClick={() => onCambiarEstado(pedido.id, 'En Preparación')}
            className="w-full rounded bg-yellow-500 py-2 font-bold text-white hover:bg-yellow-600"
          >
            Preparar
          </button>
        )}

        {pedido.estado === 'En Preparación' && (
          <button
            type="button"
            onClick={() => onCambiarEstado(pedido.id, 'Listo')}
            className="w-full rounded bg-blue-500 py-2 font-bold text-white hover:bg-blue-600"
          >
            Marcar como listo
          </button>
        )}

        {pedido.estado === 'Listo' &&
          pedido.tipo_entrega === 'Delivery' &&
          esAdministradora && (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <select
                value={motorizadoSeleccionado ?? ''}
                onChange={(event) =>
                  onSeleccionarMotorizado(pedido.id, event.target.value)
                }
                className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-800"
              >
                <option value="">Selecciona un motorizado</option>
                {motorizados.map((motorizado) => (
                  <option key={motorizado.id} value={motorizado.id}>
                    {motorizado.username}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onAsignarMotorizado(pedido.id)}
                disabled={!motorizadoSeleccionado}
                className="rounded bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          )}

        {pedido.estado === 'Listo' &&
          pedido.tipo_entrega === 'Delivery' &&
          !esAdministradora && (
            <p className="w-full rounded bg-blue-50 py-2 text-center font-bold text-blue-600">
              🛵 Pedido listo; esperando asignación de motorizado
            </p>
          )}

        {pedido.estado === 'Listo' &&
          pedido.tipo_entrega !== 'Delivery' && (
            <button
              type="button"
              onClick={() => onCambiarEstado(pedido.id, 'Entregado')}
              className="w-full rounded bg-green-600 py-2 font-bold text-white hover:bg-green-700"
            >
              Marcar como entregado
            </button>
          )}
      </div>

      <button
        type="button"
        aria-expanded={historialAbierto}
        onClick={() => onAbrirHistorial(pedido.id)}
        className="mt-3 w-full rounded-lg border border-gray-300 bg-white py-2 font-semibold text-gray-700 hover:bg-gray-50"
      >
        {historialAbierto ? 'Ocultar historial' : 'Ver historial del pedido'}
      </button>

      {historialAbierto && (
        <section
          aria-label={`Historial del pedido ${pedido.id}`}
          className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h3 className="mb-3 font-bold text-gray-800">
            Trazabilidad del pedido
          </h3>

          {cargandoHistorial ? (
            <p className="text-sm text-gray-600">Cargando historial...</p>
          ) : errorHistorial ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {errorHistorial}
            </p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-gray-600">
              El pedido aún no tiene cambios de estado registrados.
            </p>
          ) : (
            <ol className="space-y-3">
              {historial.map((evento) => (
                <li
                  key={evento.id}
                  className="border-l-2 border-[#7A1010] pl-3"
                >
                  <p className="font-semibold text-gray-800">
                    {evento.estado_anterior ?? 'Creado'} → {evento.estado_nuevo}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatearFecha(evento.fecha_cambio)} · Responsable:{' '}
                    {evento.usuario}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {esAdministradora &&
        !['Entregado', 'Cancelado'].includes(pedido.estado) && (
          <button
            type="button"
            onClick={() => onAnularPedido(pedido.id)}
            className="mt-3 w-full rounded-lg bg-red-600 py-2 font-bold text-white hover:bg-red-700"
          >
            Anular pedido
          </button>
        )}
    </article>
  );
}