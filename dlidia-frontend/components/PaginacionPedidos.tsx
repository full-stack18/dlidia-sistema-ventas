'use client';

interface PaginacionPedidosProps {
  pagina: number;
  totalPaginas: number;
  totalPedidos: number;
  onCambiarPagina: (pagina: number) => void;
}

export default function PaginacionPedidos({
  pagina,
  totalPaginas,
  totalPedidos,
  onCambiarPagina
}: PaginacionPedidosProps) {
  return (
    <nav
      aria-label="Paginación de pedidos"
      className="mt-6 flex flex-wrap items-center justify-center gap-4"
    >
      <button
        type="button"
        onClick={() => onCambiarPagina(Math.max(1, pagina - 1))}
        disabled={pagina <= 1}
        className="rounded-lg bg-gray-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>

      <span className="text-sm text-gray-700">
        Página {pagina} de {totalPaginas} · {totalPedidos} pedidos
      </span>

      <button
        type="button"
        onClick={() =>
          onCambiarPagina(Math.min(totalPaginas, pagina + 1))
        }
        disabled={pagina >= totalPaginas || totalPedidos === 0}
        className="rounded-lg bg-gray-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
      </button>
    </nav>
  );
}