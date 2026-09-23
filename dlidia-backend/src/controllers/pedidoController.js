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
        res.status(500).json({ error: 'Error al crear el pedido', detalle: error.message });
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
        const pedido = await pedidoService.cambiarEstadoPedido(id, estado, req.io, req.usuario.rol);
        res.status(200).json(pedido);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Error al actualizar estado' });
    }
};

export const obtenerDelivery = async (req, res) => {
    try {
        const pedidos = await pedidoService.listarPedidosDelivery();
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar pedidos de delivery' });
    }
};

export const cuadreDeCaja = async (req, res) => {
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