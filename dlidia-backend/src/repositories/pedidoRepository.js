import pool from '../config/db.js';

export const guardarPedido = async (usuarioId, origen, tipoEntrega, total, nombreCliente, telefonoCliente, direccionEntrega) => {
    const query = `
        INSERT INTO pedidos (usuario_id, estado, origen, tipo_entrega, total, nombre_cliente, telefono_cliente, direccion_entrega)
        VALUES ($1, 'Pendiente', $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const values = [usuarioId || null, origen, tipoEntrega, total, nombreCliente || null, telefonoCliente || null, direccionEntrega || null];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const obtenerTodosLosPedidos = async () => {
    // Usamos el nombre correcto de la columna: fecha_creacion
    const query = 'SELECT * FROM pedidos ORDER BY fecha_creacion DESC;';
    const result = await pool.query(query);
    return result.rows;
};

export const actualizarEstado = async (id, nuevoEstado) => {
    const query = 'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *;';
    const result = await pool.query(query, [nuevoEstado, id]);
    return result.rows[0];
};

export const obtenerPedidosDelivery = async () => {
    // Igual aquí para la vista del motorizado
    const query = `
        SELECT * FROM pedidos 
        WHERE tipo_entrega = 'Delivery' AND estado != 'Entregado'
        ORDER BY fecha_creacion ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const obtenerVentasDelDia = async (fecha) => {
    // TO_CHAR extrae el texto exacto 'YYYY-MM-DD' ignorando cualquier zona horaria oculta
    const query = `
        SELECT * FROM pedidos 
        WHERE estado = 'Entregado' 
        AND TO_CHAR(fecha_creacion, 'YYYY-MM-DD') = $1
        ORDER BY fecha_creacion DESC;
    `;
    const result = await pool.query(query, [fecha]);
    return result.rows;
};

export const obtenerPedidoPorId = async (id) => {
    const query = 'SELECT * FROM pedidos WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

export const obtenerEstadoPorId = async (id) => {
    const query = 'SELECT id, estado, tipo_entrega, total, fecha_creacion FROM pedidos WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};