import * as pedidoRepository from '../repositories/pedidoRepository.js';

export const procesarNuevoPedido = async (datosPedido, io) => {
    const { usuarioId, origen, tipoEntrega, total, nombreCliente, telefonoCliente, direccionEntrega } = datosPedido;

    const nuevoPedido = await pedidoRepository.guardarPedido(
        usuarioId, origen, tipoEntrega, total, nombreCliente, telefonoCliente, direccionEntrega
    );

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