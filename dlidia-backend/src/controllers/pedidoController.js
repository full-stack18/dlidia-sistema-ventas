import * as pedidoService from '../services/pedidoService.js';

export const crearPedido = async (req, res, next) => {
    try {
        const pedido = await pedidoService.procesarNuevoPedido(req.body, req.io);

        return res.status(201).json({
            mensaje: 'Pedido creado exitosamente',
            pedido
        });
    } catch (error) {
        next(error);
    }
};

export const obtenerPedidos = async (req, res, next) => {
    try {
        const pedidos = await pedidoService.listarPedidos(req.usuario.rol);
        return res.status(200).json(pedidos);
    } catch (error) {
        next(error);
    }
};

export const actualizarEstado = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const pedido = await pedidoService.cambiarEstadoPedido(
            id,
            estado,
            req.io,
            req.usuario.rol,
            req.usuario.id
        );

        return res.status(200).json(pedido);
    } catch (error) {
        next(error);
    }
};

export const obtenerDelivery = async (req, res, next) => {
    try {
        const pedidos = await pedidoService.listarPedidosDelivery(
            req.usuario.id,
            req.usuario.rol
        );

        return res.status(200).json(pedidos);
    } catch (error) {
        next(error);
    }
};

export const cuadreDeCaja = async (req, res, next) => {
    if (!['Cajero', 'Administradora'].includes(req.usuario?.rol)) {
        return res.status(403).json({
            error: 'Solo Cajero o Administradora pueden consultar la caja'
        });
    }

    try {
        const fechaConsulta =
            req.query.fecha || new Date().toISOString().split('T')[0];

        const ventas = await pedidoService.obtenerVentasParaCaja(fechaConsulta);
        const totalCaja = ventas.reduce(
            (sum, pedido) => sum + Number(pedido.total),
            0
        );

        return res.status(200).json({
            fecha: fechaConsulta,
            total: totalCaja,
            ventas
        });
    } catch (error) {
        next(error);
    }
};

export const obtenerAnulacionesCaja = async (req, res, next) => {
    try {
        const hoyLima = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const fechaConsulta = req.query.fecha || hoyLima;

        const anulaciones = await pedidoService.obtenerAnulacionesParaCaja(
            fechaConsulta,
            req.usuario?.rol
        );

        return res.status(200).json(anulaciones);
    } catch (error) {
        next(error);
    }
};

export const obtenerPedidosPendientesDePago = async (req, res, next) => {
    try {
        const pedidos = await pedidoService.listarPedidosPendientesDePago(
            req.usuario.rol
        );

        return res.status(200).json(pedidos);
    } catch (error) {
        next(error);
    }
};

export const consultarEstadoPublico = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoService.obtenerEstadoPedido(id);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        return res.status(200).json({
            id: pedido.id,
            estado: pedido.estado,
            tipo_entrega: pedido.tipo_entrega
        });
    } catch (error) {
        next(error);
    }
};

export const obtenerMotorizados = async (req, res, next) => {
    try {
        const motorizados = await pedidoService.listarMotorizados(
            req.usuario.rol
        );

        return res.status(200).json(motorizados);
    } catch (error) {
        next(error);
    }
};

export const asignarMotorizado = async (req, res, next) => {
    try {
        const pedido = await pedidoService.asignarMotorizado({
            pedidoId: req.params.id,
            motorizadoId: req.body.motorizadoId,
            usuario: req.usuario,
            io: req.io
        });

        return res.status(200).json(pedido);
    } catch (error) {
        next(error);
    }
};

export const registrarCierreCaja = async (req, res, next) => {
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
        if (error.code === '23505') {
            error.status = 409;
            error.message = 'Este usuario ya registró un cierre para hoy';
        }

        next(error);
    }
};

export const obtenerHistorialCierresCaja = async (req, res, next) => {
    try {
        const cierres = await pedidoService.consultarHistorialCierresCaja(
            req.usuario
        );

        return res.status(200).json(cierres);
    } catch (error) {
        next(error);
    }
};