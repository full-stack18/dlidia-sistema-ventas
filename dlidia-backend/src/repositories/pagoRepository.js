import pool from '../config/db.js';

const METODOS_PAGO = ['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Otro'];

export const registrarPagoConfirmado = async ({
    pedidoId,
    metodoPago,
    usuarioId,
    referencia
}) => {
    if (!Number.isInteger(Number(pedidoId))) {
        const error = new Error('El identificador del pedido no es válido');
        error.status = 400;
        throw error;
    }

    if (!METODOS_PAGO.includes(metodoPago)) {
        const error = new Error('El método de pago no es válido');
        error.status = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Bloquea el pedido mientras se registra el pago.
        // Así se reduce el riesgo de cobrarlo dos veces en paralelo.
        const pedidoResult = await client.query(
            `SELECT id, total, estado
             FROM pedidos
             WHERE id = $1
             FOR UPDATE;`,
            [pedidoId]
        );

        const pedido = pedidoResult.rows[0];

        if (!pedido) {
            const error = new Error('Pedido no encontrado');
            error.status = 404;
            throw error;
        }

        if (pedido.estado === 'Cancelado') {
            const error = new Error('No se puede cobrar un pedido cancelado');
            error.status = 409;
            throw error;
        }

        const pagoResult = await client.query(
            `INSERT INTO pagos (
                pedido_id,
                importe,
                metodo_pago,
                estado,
                fecha_confirmacion,
                usuario_id,
                referencia
            )
            VALUES ($1, $2, $3, 'Confirmado', NOW(), $4, $5)
            RETURNING
                pago_id,
                pedido_id,
                importe,
                metodo_pago,
                estado,
                fecha_registro,
                fecha_confirmacion,
                usuario_id,
                referencia;`,
            [
                pedido.id,
                pedido.total,
                metodoPago,
                usuarioId ?? null,
                referencia?.trim() || null
            ]
        );

        await client.query('COMMIT');
        return pagoResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');

        // El índice único de la tabla impide confirmar otro pago
        // para el mismo pedido.
        if (error.code === '23505') {
            const conflicto = new Error('Este pedido ya tiene un pago confirmado');
            conflicto.status = 409;
            throw conflicto;
        }

        throw error;
    } finally {
        client.release();
    }
};