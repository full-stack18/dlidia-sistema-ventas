import * as pedidoRepository from '../repositories/pedidoRepository.js';
import { normalizarItemsPedido } from '../utils/pedidoRules.js';

export const procesarNuevoPedido = async (datosPedido, io) => {
    const { tipoEntrega, nombreCliente, telefonoCliente, direccionEntrega } = datosPedido;
    const tiposEntregaPermitidos = ['Mesa', 'Para Llevar', 'Delivery'];

    if (!tiposEntregaPermitidos.includes(tipoEntrega)) {
        const error = new Error('El tipo de entrega no es válido');
        error.status = 400;
        throw error;
    }

    if (typeof nombreCliente !== 'string' || !nombreCliente.trim() || nombreCliente.trim().length > 100) {
        const error = new Error('El nombre del cliente es obligatorio y debe tener hasta 100 caracteres');
        error.status = 400;
        throw error;
    }

    if (tipoEntrega === 'Delivery') {
        if (typeof telefonoCliente !== 'string' || !telefonoCliente.trim() || telefonoCliente.trim().length > 20) {
            const error = new Error('El teléfono es obligatorio para delivery');
            error.status = 400;
            throw error;
        }
        if (typeof direccionEntrega !== 'string' || !direccionEntrega.trim()) {
            const error = new Error('La dirección es obligatoria para delivery');
            error.status = 400;
            throw error;
        }
    }

    const itemsNormalizados = normalizarItemsPedido(datosPedido.items);

    if (datosPedido.items.length > 50) {
        const observaciones = item.observaciones ?? null;

        if (
            observaciones !== null &&
            (typeof observaciones !== 'string' || observaciones.length > 500)
        ) {
            const error = new Error(
                'Las observaciones deben ser texto de hasta 500 caracteres'
            );
            error.status = 400;
            throw error;
        }
    }

    const itemsAgrupados = new Map();
    for (const item of datosPedido.items) {
        if (!item || typeof item !== 'object') {
            const error = new Error('El formato de los productos del pedido no es válido');
            error.status = 400;
            throw error;
        }
        const platoId = Number(item.platoId);
        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(platoId) || platoId <= 0 || !Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 99) {
            const error = new Error('Cada plato debe tener un identificador válido y una cantidad entre 1 y 99');
            error.status = 400;
            throw error;
        }

        const observaciones = item.observaciones ?? null;

        if (
            observaciones !== null &&
            (typeof observaciones !== 'string' || observaciones.length > 500)
        ) {
            const error = new Error(
                'Las observaciones deben ser texto de hasta 500 caracteres'
            );
            error.status = 400;
            throw error;
        }

        const existente = itemsAgrupados.get(platoId);
        const cantidadTotal = (existente?.cantidad || 0) + cantidad;
        if (cantidadTotal > 99) {
            const error = new Error('La cantidad acumulada de un plato no puede superar 99 unidades');
            error.status = 400;
            throw error;
        }

        itemsAgrupados.set(platoId, {
            platoId,
            cantidad: cantidadTotal,
            observaciones: observaciones?.trim() || null
        });
    }

    const nuevoPedido = await pedidoRepository.guardarPedidoConDetalles({
        usuarioId: null,
        origen: 'Portal Web',
        tipoEntrega,
        nombreCliente: nombreCliente.trim(),
        telefonoCliente: telefonoCliente?.trim() || null,
        direccionEntrega: tipoEntrega === 'Delivery' ? direccionEntrega.trim() : null,
        items: itemsNormalizados
    });

    io.emit('nuevo_pedido', nuevoPedido);
    return nuevoPedido;
};

export const listarPedidos = async () => {
    return await pedidoRepository.obtenerTodosLosPedidos();
};

export const cambiarEstadoPedido = async (id, nuevoEstado, io, usuarioRol) => {
    const pedidoActual = await pedidoRepository.obtenerPedidoPorId(id);
    if (!pedidoActual) {
        const err = new Error('Pedido no encontrado');
        err.status = 404;
        throw err;
    }

    // Regla de negocio: solo Motorizado (o Administradora, como override) cierra un delivery
    if (pedidoActual.tipo_entrega === 'Delivery' && nuevoEstado === 'Entregado') {
        if (!['Motorizado', 'Administradora'].includes(usuarioRol)) {
            const err = new Error('Solo el motorizado puede confirmar la entrega de un pedido a domicilio');
            err.status = 403;
            throw err;
        }
    }

    const pedidoActualizado = await pedidoRepository.actualizarEstado(id, nuevoEstado);
    io.emit('estado_actualizado', pedidoActualizado);
    return pedidoActualizado;
};

export const listarPedidosDelivery = async () => {
    return await pedidoRepository.obtenerPedidosDelivery();
};

export const obtenerVentasParaCaja = async (fecha) => {
    return await pedidoRepository.obtenerVentasDelDia(fecha);
};

export const obtenerEstadoPedido = async (id) => {
    return await pedidoRepository.obtenerEstadoPorId(id);
};
