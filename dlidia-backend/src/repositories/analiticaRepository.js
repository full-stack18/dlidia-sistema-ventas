import pool from '../config/db.js';

export const obtenerAnalisisVentas = async (desde, hasta) => {
    const parametros = [desde, hasta];

    const [
        resumenResult,
        ventasPorDiaResult,
        platosResult,
        metodosResult,
        canalesResult,
        horasResult,
        anulacionesResult
    ] = await Promise.all([
        pool.query(
            `
            SELECT
                COALESCE(SUM(pa.importe), 0)::numeric(12, 2)
                    AS ingresos_confirmados,
                COUNT(DISTINCT pa.pedido_id)::int
                    AS pedidos_pagados,
                COALESCE(AVG(pa.importe), 0)::numeric(12, 2)
                    AS ticket_promedio
            FROM pagos pa
            WHERE pa.estado = 'Confirmado'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                    AS fecha,
                COALESCE(SUM(pa.importe), 0)::numeric(12, 2) AS total,
                COUNT(DISTINCT pa.pedido_id)::int AS pedidos
            FROM pagos pa
            WHERE pa.estado = 'Confirmado'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date
            GROUP BY
                (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
            ORDER BY fecha;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                d.nombre_plato AS nombre,
                COALESCE(SUM(d.cantidad), 0)::int AS cantidad_vendida,
                COALESCE(SUM(d.subtotal), 0)::numeric(12, 2)
                    AS ingresos_generados
            FROM detalle_pedidos d
            WHERE EXISTS (
                SELECT 1
                FROM pagos pa
                WHERE pa.pedido_id = d.pedido_id
                  AND pa.estado = 'Confirmado'
                  AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                      BETWEEN $1::date AND $2::date
            )
            GROUP BY d.nombre_plato
            ORDER BY cantidad_vendida DESC, ingresos_generados DESC
            LIMIT 10;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                pa.metodo_pago,
                COUNT(DISTINCT pa.pedido_id)::int AS pedidos,
                COALESCE(SUM(pa.importe), 0)::numeric(12, 2) AS total
            FROM pagos pa
            WHERE pa.estado = 'Confirmado'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date
            GROUP BY pa.metodo_pago
            ORDER BY total DESC;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                p.tipo_entrega,
                p.origen,
                COUNT(DISTINCT p.id)::int AS pedidos,
                COALESCE(SUM(pa.importe), 0)::numeric(12, 2) AS total
            FROM pagos pa
            INNER JOIN pedidos p ON p.id = pa.pedido_id
            WHERE pa.estado = 'Confirmado'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date
            GROUP BY p.tipo_entrega, p.origen
            ORDER BY total DESC;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                EXTRACT(
                    HOUR FROM (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')
                )::int AS hora,
                COUNT(DISTINCT pa.pedido_id)::int AS pedidos,
                COALESCE(SUM(pa.importe), 0)::numeric(12, 2) AS total
            FROM pagos pa
            WHERE pa.estado = 'Confirmado'
              AND (pa.fecha_confirmacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date
            GROUP BY hora
            ORDER BY pedidos DESC, total DESC;
            `,
            parametros
        ),

        pool.query(
            `
            SELECT
                COUNT(*)::int AS pedidos_anulados,
                COALESCE(SUM(cancelados.total), 0)::numeric(12, 2)
                    AS monto_anulado
            FROM (
                SELECT
                    p.id,
                    p.total,
                    MIN(h.fecha_cambio) AS fecha_anulacion
                FROM historial_estados_pedido h
                INNER JOIN pedidos p ON p.id = h.pedido_id
                WHERE h.estado_nuevo = 'Cancelado'
                GROUP BY p.id, p.total
            ) cancelados
            WHERE (cancelados.fecha_anulacion AT TIME ZONE 'America/Lima')::date
                  BETWEEN $1::date AND $2::date;
            `,
            parametros
        )
    ]);

    return {
        resumen: resumenResult.rows[0],
        ventasPorDia: ventasPorDiaResult.rows,
        platosMasVendidos: platosResult.rows,
        pagosPorMetodo: metodosResult.rows,
        ventasPorModalidad: canalesResult.rows,
        horasConMasVentas: horasResult.rows,
        anulaciones: anulacionesResult.rows[0]
    };
};