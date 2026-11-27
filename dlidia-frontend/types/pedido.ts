export interface Pedido {
  id: number;
  origen: string;
  tipo_entrega: string;
  total: number;
  estado: string;
  detalles: DetallePedido[];
  motorizado_id?: number | null;
  fecha_creacion: string;
}

export interface Motorizado {
  id: number;
  username: string;
}

export interface DetallePedido {
  id: number;
  plato_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string | null;
}

export interface HistorialEstadoPedido {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  fecha_cambio: string;
  usuario: string;
}