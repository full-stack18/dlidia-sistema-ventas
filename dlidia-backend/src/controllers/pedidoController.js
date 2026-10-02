import * as pedidoService from '../services/pedidoService.js';

export const crearPedido = async (req, res) => {
    try {
        const pedido = await pedidoService.procesarNuevoPedido(req.body, req.io);
        res.status(201).json({
            mensaje: 'Pedido creado exitosamente',
            pedido
        });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({
            error: error.status ? error.message : 'Error al crear el pedido'
        });
    }
};

export const obtenerPedidos = async (req, res) => {
    try {
        const pedidos = await pedidoService.listarPedidos();
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
};

export const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const pedido = await pedidoService.cambiarEstadoPedido(id, estado, req.io, req.usuario.rol, req.usuario.id);
        res.status(200).json(pedido);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Error al actualizar estado' });
    }
};

export const obtenerDelivery = async (req, res) => {
    try {
        const pedidos = await pedidoService.listarPedidosDelivery(
            req.usuario.id,
            req.usuario.rol
        );
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Error al cargar pedidos de delivery'
        });
    }
};

export const cuadreDeCaja = async (req, res) => {
    if (!['Cajero', 'Administradora'].includes(req.usuario?.rol)) {
        return res.status(403).json({
            error: 'Solo Cajero o Administradora pueden consultar la caja'
        });
    }
    
    try {
        const fechaConsulta = req.query.fecha || new Date().toISOString().split('T')[0];
        const ventas = await pedidoService.obtenerVentasParaCaja(fechaConsulta);
        const totalCaja = ventas.reduce((sum, pedido) => sum + Number(pedido.total), 0);
        res.status(200).json({ fecha: fechaConsulta, total: totalCaja, ventas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar el cuadre de caja' });
    }
};

export const obtenerPedidosPendientesDePago = async (req, res) => {
    try {
        const pedidos = await pedidoService.listarPedidosPendientesDePago(
            req.usuario.rol
        );

        res.status(200).json(pedidos);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Error al cargar pedidos pendientes de pago'
        });
    }
};

export const consultarEstadoPublico = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoService.obtenerEstadoPedido(id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar el estado del pedido' });
    }
};

export const obtenerMotorizados = async (req, res) => {
    try {
        const motorizados = await pedidoService.listarMotorizados(
            req.usuario.rol
        );

        res.status(200).json(motorizados);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Error al obtener los motorizados'
        });
    }
};

export const asignarMotorizado = async (req, res) => {
    try {
        const pedido = await pedidoService.asignarMotorizado({
            pedidoId: req.params.id,
            motorizadoId: req.body.motorizadoId,
            usuario: req.usuario,
            io: req.io
        });

        res.status(200).json(pedido);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Error al asignar el motorizado'
        });
    }
};

export const registrarCierreCaja = async (req, res) => {
    try {
        const cierre = await pedidoService.cerrarCaja({
            usuarioId: req.usuario.id,
            usuarioRol: req.usuario.rol,
            montoContado: req.body.montoContado,
            observacion: req.body.observacion
        });

        return res.status(201).json({
            mensaje: 'Cierre de caja registrado exitosamente',
            cierre
        });
    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Este usuario ya registró un cierre para hoy'
            });
        }

        return res.status(error.status || 500).json({
            error: error.message || 'Error al registrar el cierre de caja'
        });
    }
};