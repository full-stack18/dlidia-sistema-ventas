import pool from '../config/db.js';
import { calcularTotalCentimos } from '../utils/pedidoRules.js';

const consultaPedidosConDetalles = `
    SELECT
        p.*,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', d.id,
                    'plato_id', d.plato_id,
                    'nombre', d.nombre_plato,
                    'cantidad', d.cantidad,
                    'precio_unitario', d.precio_unitario,
                    'subtotal', d.subtotal,
                    'observaciones', d.observaciones
                ) ORDER BY d.id
            ) FILTER (WHERE d.id IS NOT NULL),
            '[]'::json
        ) AS detalles
    FROM pedidos p
    LEFT JOIN detalle_pedidos d ON d.pedido_id = p.id
`;

const obtenerPedidoCompletoConCliente = async (db, id) => {
    const result = await db.query(`
        ${consultaPedidosConDetalles}
        WHERE p.id = $1
        GROUP BY p.id;
    `, [id]);
    return result.rows[0];
};

export const guardarPedidoConDetalles = async ({
    usuarioId,
    origen,
    tipoEntrega,
    nombreCliente,
    telefonoCliente,
    direccionEntrega,
    items
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ids = items.map((item) => item.platoId);
        const platosResult = await client.query(`
            SELECT id, nombre, precio, disponible
            FROM platos
            WHERE id = ANY($1::int[])
            FOR SHARE;
        `, [ids]);

        const platosPorId = new Map(platosResult.rows.map((plato) => [plato.id, plato]));
        const detalles = items.map((item) => {
            const plato = platosPorId.get(item.platoId);

            if (!plato || plato.disponible !== true) {
                const error = new Error(
                    `El plato ${item.platoId} no existe o no está disponible`
                );
                error.status = 400;
                throw error;
            }

            const precioUnitario = Number(plato.precio);

            if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
                const error = new Error(
                    `El precio del plato ${item.platoId} no es válido`
                );
                error.status = 400;
                throw error;
            }

            return {
                ...item,
                nombre: plato.nombre,
                precioUnitario
            };
        });

        const totalCentimos = calcularTotalCentimos(detalles);
        const total = (totalCentimos / 100).toFixed(2);

        const pedidoResult = await client.query(`
            INSERT INTO pedidos (
                usuario_id,
                estado,
                origen,
                tipo_entrega,
                total,
                nombre_cliente,
                telefono_cliente,
                direccion_entrega
            )
            VALUES ($1, 'Pendiente', $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `, [
            usuarioId || null,
            origen,
            tipoEntrega,
            total,
            nombreCliente,
            telefonoCliente || null,
            direccionEntrega || null
        ]);

        const pedidoId = pedidoResult.rows[0].id;
        const parametros = [];
        const valores = detalles.map((detalle, indice) => {
            const base = indice * 6;
            parametros.push(
                pedidoId,
                detalle.platoId,
                detalle.nombre,
                detalle.cantidad,
                detalle.precioUnitario,
                detalle.observaciones || null
            );
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        });

        await client.query(`
            INSERT INTO detalle_pedidos (
                pedido_id,
                plato_id,
                nombre_plato,
                cantidad,
                precio_unitario,
                observaciones
            )
            VALUES ${valores.join(', ')};
        `, parametros);

        const pedido = await obtenerPedidoCompletoConCliente(client, pedidoId);
        await client.query('COMMIT');
        return pedido;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerTodosLosPedidos = async () => {
    const query = `
        ${consultaPedidosConDetalles}
        GROUP BY p.id
        ORDER BY p.fecha_creacion DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const actualizarEstado = async (id, nuevoEstado, usuarioId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const pedidoActual = await client.query(
            'SELECT estado FROM pedidos WHERE id = $1 FOR UPDATE;',
            [id]
        );

        if (!pedidoActual.rows[0]) {
            await client.query('ROLLBACK');
            return undefined;
        }

        const estadoAnterior = pedidoActual.rows[0].estado;

        await client.query(
            'UPDATE pedidos SET estado = $1 WHERE id = $2;',
            [nuevoEstado, id]
        );

        await client.query(
            `INSERT INTO historial_estados_pedido (
                pedido_id,
                estado_anterior,
                estado_nuevo,
                usuario_id
            )
            VALUES ($1, $2, $3, $4);`,
            [id, estadoAnterior, nuevoEstado, usuarioId ?? null]
        );

        const pedido = await obtenerPedidoCompletoConCliente(client, id);

        await client.query('COMMIT');
        return pedido;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerPedidosDelivery = async (motorizadoId) => {
    const query = `
        ${consultaPedidosConDetalles}
        WHERE p.tipo_entrega = 'Delivery'
          AND p.motorizado_id = $1
          AND p.estado NOT IN ('Entregado', 'Cancelado')
        GROUP BY p.id
        ORDER BY p.fecha_creacion ASC;
    `;

    const result = await pool.query(query, [motorizadoId]);
    return result.rows;
};

export const obtenerVentasDelDia = async (fecha) => {
    const query = `
        ${consultaPedidosConDetalles}
        WHERE p.estado = 'Entregado'
          AND TO_CHAR(p.fecha_creacion, 'YYYY-MM-DD') = $1
        GROUP BY p.id
        ORDER BY p.fecha_creacion DESC;
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
    const query = `
        SELECT
            p.id,
            p.estado,
            p.tipo_entrega,
            p.total,
            p.fecha_creacion,
            COALESCE(
                json_agg(
                    json_build_object(
                        'nombre', d.nombre_plato,
                        'cantidad', d.cantidad,
                        'precio_unitario', d.precio_unitario,
                        'subtotal', d.subtotal
                    ) ORDER BY d.id
                ) FILTER (WHERE d.id IS NOT NULL),
                '[]'::json
            ) AS detalles
        FROM pedidos p
        LEFT JOIN detalle_pedidos d ON d.pedido_id = p.id
        WHERE p.id = $1
        GROUP BY p.id;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

export const listarMotorizados = async () => {
    const result = await pool.query(`
        SELECT id, username
        FROM usuarios
        WHERE rol = 'Motorizado'
        ORDER BY username;
    `);

    return result.rows;
};

export const asignarMotorizadoAPedido = async ({
    pedidoId,
    motorizadoId,
    usuarioAdminId
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const motorizado = await client.query(`
            SELECT id
            FROM usuarios
            WHERE id = $1 AND rol = 'Motorizado';
        `, [motorizadoId]);

        if (!motorizado.rows[0]) {
            const error = new Error('El usuario seleccionado no es un motorizado válido');
            error.status = 400;
            throw error;
        }

        const pedidoResult = await client.query(`
            SELECT id, estado, tipo_entrega
            FROM pedidos
            WHERE id = $1
            FOR UPDATE;
        `, [pedidoId]);

        const pedidoActual = pedidoResult.rows[0];

        if (!pedidoActual) {
            const error = new Error('Pedido no encontrado');
            error.status = 404;
            throw error;
        }

        if (
            pedidoActual.tipo_entrega !== 'Delivery' ||
            pedidoActual.estado !== 'Listo'
        ) {
            const error = new Error(
                'Solo se puede asignar un motorizado a un pedido Delivery que esté Listo'
            );
            error.status = 409;
            throw error;
        }

        await client.query(`
            UPDATE pedidos
            SET motorizado_id = $1,
                estado = 'Asignado'
            WHERE id = $2;
        `, [motorizadoId, pedidoId]);

        await client.query(`
            INSERT INTO historial_estados_pedido (
                pedido_id,
                estado_anterior,
                estado_nuevo,
                usuario_id
            )
            VALUES ($1, $2, $3, $4);
        `, [
            pedidoId,
            pedidoActual.estado,
            'Asignado',
            usuarioAdminId
        ]);

        const pedidoActualizado =
            await obtenerPedidoCompletoConCliente(client, pedidoId);

        await client.query('COMMIT');
        return pedidoActualizado;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};