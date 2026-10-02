import * as pedidoRepository from '../repositories/pedidoRepository.js';
import { normalizarItemsPedido } from '../utils/pedidoRules.js';
import {
    ESTADOS_PEDIDO,
    validarCambioEstado
} from '../utils/pedidoStateMachine.js';

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

export const cambiarEstadoPedido = async (id, nuevoEstado, io, usuarioRol, usuarioId) => {
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

    const pedidoActualizado = await pedidoRepository.actualizarEstado(id, nuevoEstado, usuarioId);
    io.emit('estado_actualizado', pedidoActualizado);
    return pedidoActualizado;
};

export const listarPedidosDelivery = async (usuarioId, usuarioRol) => {
    if (usuarioRol !== 'Motorizado') {
        const error = new Error('Solo un motorizado puede consultar sus pedidos asignados');
        error.status = 403;
        throw error;
    }

    return await pedidoRepository.obtenerPedidosDelivery(usuarioId);
};

export const obtenerVentasParaCaja = async (fecha) => {
    return await pedidoRepository.obtenerVentasDelDia(fecha);
};

export const listarPedidosPendientesDePago = async (usuarioRol) => {
    if (!['Cajero', 'Administradora'].includes(usuarioRol)) {
        const error = new Error(
            'Solo Cajero o Administradora pueden consultar pagos pendientes'
        );
        error.status = 403;
        throw error;
    }

    return await pedidoRepository.obtenerPedidosPendientesDePago();
};

export const obtenerEstadoPedido = async (id) => {
    return await pedidoRepository.obtenerEstadoPorId(id);
};

export const listarMotorizados = async (usuarioRol) => {
    if (usuarioRol !== 'Administradora') {
        const error = new Error('Solo la administradora puede consultar los motorizados');
        error.status = 403;
        throw error;
    }

    return await pedidoRepository.listarMotorizados();
};

export const asignarMotorizado = async ({
    pedidoId,
    motorizadoId,
    usuario,
    io
}) => {
    if (usuario.rol !== 'Administradora') {
        const error = new Error('Solo la administradora puede asignar motorizados');
        error.status = 403;
        throw error;
    }

    const idPedido = Number(pedidoId);
    const idMotorizado = Number(motorizadoId);

    if (
        !Number.isInteger(idPedido) ||
        idPedido <= 0 ||
        !Number.isInteger(idMotorizado) ||
        idMotorizado <= 0
    ) {
        const error = new Error('Los identificadores del pedido y motorizado no son válidos');
        error.status = 400;
        throw error;
    }

    const pedidoActual = await pedidoRepository.obtenerPedidoPorId(idPedido);

    if (!pedidoActual) {
        const error = new Error('Pedido no encontrado');
        error.status = 404;
        throw error;
    }

    validarCambioEstado({
        estadoActual: pedidoActual.estado,
        nuevoEstado: ESTADOS_PEDIDO.ASIGNADO,
        tipoEntrega: pedidoActual.tipo_entrega
    });

    const pedidoActualizado =
        await pedidoRepository.asignarMotorizadoAPedido({
            pedidoId: idPedido,
            motorizadoId: idMotorizado,
            usuarioAdminId: usuario.id
        });

    io.emit('estado_actualizado', pedidoActualizado);
    return pedidoActualizado;
};

export const cerrarCaja = async ({
    usuarioId,
    usuarioRol,
    montoContado,
    observacion
}) => {
    if (!['Cajero', 'Administradora'].includes(usuarioRol)) {
        const error = new Error(
            'Solo Cajero o Administradora pueden registrar un cierre de caja'
        );
        error.status = 403;
        throw error;
    }

    const id = Number(usuarioId);
    const monto = Number(montoContado);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error('El usuario no es válido');
        error.status = 400;
        throw error;
    }

    if (!Number.isFinite(monto) || monto < 0) {
        const error = new Error(
            'El monto contado debe ser un número válido mayor o igual a cero'
        );
        error.status = 400;
        throw error;
    }

    if (
        observacion !== undefined &&
        observacion !== null &&
        typeof observacion !== 'string'
    ) {
        const error = new Error('La observación debe ser texto');
        error.status = 400;
        throw error;
    }

    return await pedidoRepository.registrarCierreCaja({
        usuarioId: id,
        montoContado: monto,
        observacion: observacion?.trim() || null
    });
};