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
        SELECT
            p.id,
            p.origen,
            p.tipo_entrega,
            pa.importe AS total,
            pa.fecha_confirmacion AS fecha_creacion,
            pa.metodo_pago,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', d.id,
                        'nombre', d.nombre_plato,
                        'cantidad', d.cantidad,
                        'subtotal', d.subtotal
                    ) ORDER BY d.id
                ) FILTER (WHERE d.id IS NOT NULL),
                '[]'::json
            ) AS detalles
        FROM pedidos p
        INNER JOIN pagos pa
            ON pa.pedido_id = p.id
        LEFT JOIN detalle_pedidos d
            ON d.pedido_id = p.id
        WHERE pa.estado = 'Confirmado'
          AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date = $1::date
        GROUP BY
            p.id,
            p.origen,
            p.tipo_entrega,
            pa.pago_id,
            pa.importe,
            pa.fecha_confirmacion,
            pa.metodo_pago
        ORDER BY pa.fecha_confirmacion DESC;
    `;

    const result = await pool.query(query, [fecha]);
    return result.rows;
};

export const obtenerAnulacionesDelDia = async (fecha) => {
    const query = `
        SELECT
            h.id AS historial_id,
            p.id AS pedido_id,
            p.origen,
            p.tipo_entrega,
            p.total,
            p.nombre_cliente,
            h.estado_anterior,
            h.fecha_cambio AS fecha_anulacion,
            u.username AS usuario
        FROM historial_estados_pedido h
        INNER JOIN pedidos p ON p.id = h.pedido_id
        LEFT JOIN usuarios u ON u.id = h.usuario_id
        WHERE h.estado_nuevo = 'Cancelado'
          AND (h.fecha_cambio AT TIME ZONE 'America/Lima')::date = $1::date
        ORDER BY h.fecha_cambio DESC;
    `;

    const result = await pool.query(query, [fecha]);
    return result.rows;
};

export const obtenerPedidosPendientesDePago = async () => {
    const query = `
        ${consultaPedidosConDetalles}
        WHERE p.estado <> 'Cancelado'
          AND NOT EXISTS (
              SELECT 1
              FROM pagos pa
              WHERE pa.pedido_id = p.id
                AND pa.estado = 'Confirmado'
          )
        GROUP BY p.id
        ORDER BY p.fecha_creacion ASC;
    `;

    const result = await pool.query(query);
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

export const registrarCierreCaja = async ({
    usuarioId,
    montoContado,
    observacion
}) => {
    const monto = Number(montoContado);

    if (!Number.isFinite(monto) || monto < 0) {
        const error = new Error('El monto contado debe ser un número válido mayor o igual a cero');
        error.status = 400;
        throw error;
    }

    const query = `
        WITH resumen AS (
            SELECT
                COALESCE(SUM(pa.importe), 0)::numeric(10, 2) AS monto_esperado
            FROM pagos pa
            WHERE pa.estado = 'Confirmado'
              AND pa.metodo_pago = 'Efectivo'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date =
                  (NOW() AT TIME ZONE 'America/Lima')::date
        )
        INSERT INTO cierres_caja (
            usuario_id,
            fecha_cierre,
            monto_esperado,
            monto_contado,
            diferencia,
            observacion
        )
        SELECT
            $1,
            (NOW() AT TIME ZONE 'America/Lima')::date,
            resumen.monto_esperado,
            $2,
            $2 - resumen.monto_esperado,
            $3
        FROM resumen
        RETURNING *;
    `;

    const result = await pool.query(query, [
        usuarioId,
        monto.toFixed(2),
        observacion?.trim() || null
    ]);

    return result.rows[0];
};

export const obtenerHistorialCierresCaja = async (usuarioId, usuarioRol) => {
    if (usuarioRol === 'Administradora') {
        const result = await pool.query(`
            SELECT
                cc.cierre_id,
                cc.usuario_id,
                u.username AS usuario,
                cc.fecha_cierre,
                cc.monto_esperado,
                cc.monto_contado,
                cc.diferencia,
                cc.observacion,
                cc.fecha_registro
            FROM cierres_caja cc
            INNER JOIN usuarios u ON u.id = cc.usuario_id
            ORDER BY cc.fecha_cierre DESC, cc.fecha_registro DESC;
        `);

        return result.rows;
    }

    const result = await pool.query(`
        SELECT
            cc.cierre_id,
            cc.usuario_id,
            u.username AS usuario,
            cc.fecha_cierre,
            cc.monto_esperado,
            cc.monto_contado,
            cc.diferencia,
            cc.observacion,
            cc.fecha_registro
        FROM cierres_caja cc
        INNER JOIN usuarios u ON u.id = cc.usuario_id
        WHERE cc.usuario_id = $1
        ORDER BY cc.fecha_cierre DESC, cc.fecha_registro DESC;
    `, [usuarioId]);

    return result.rows;
};

export const tienePagoConfirmado = async (pedidoId) => {
    const result = await pool.query(`
        SELECT EXISTS (
            SELECT 1
            FROM pagos
            WHERE pedido_id = $1
              AND estado = 'Confirmado'
        ) AS pagado;
    `, [pedidoId]);

    return result.rows[0].pagado;
};