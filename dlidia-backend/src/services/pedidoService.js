import * as pedidoRepository from '../repositories/pedidoRepository.js';

export const procesarNuevoPedido = async (datosPedido, io) => {
    // Extraemos los nuevos campos del cuerpo de la petición
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

export const cambiarEstadoPedido = async (id, nuevoEstado, io) => {
    const pedidoActualizado = await pedidoRepository.actualizarEstado(id, nuevoEstado);
    // Empujamos la actualización a todas las pantallas conectadas
    io.emit('estado_actualizado', pedidoActualizado);
    return pedidoActualizado;
};

export const listarPedidosDelivery = async () => {
    return await pedidoRepository.obtenerPedidosDelivery();
};

export const obtenerVentasParaCaja = async (fecha) => {
    // El servicio es el encargado de llamar al repositorio
    return await pedidoRepository.obtenerVentasDelDia(fecha);
};