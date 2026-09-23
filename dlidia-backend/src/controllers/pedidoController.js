import * as pedidoService from '../services/pedidoService.js';

export const crearPedido = async (req, res) => {
    try {
        // Le pasamos req.body con los datos y req.io para emitir la alerta
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
        const pedido = await pedidoService.cambiarEstadoPedido(id, estado, req.io);
        res.status(200).json(pedido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar estado' });
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
        
        // ⚠️ CORRECCIÓN: Usamos pedidoService en lugar de pedidoRepository
        const ventas = await pedidoService.obtenerVentasParaCaja(fechaConsulta);
        
        const totalCaja = ventas.reduce((sum, pedido) => sum + Number(pedido.total), 0);

        res.status(200).json({ fecha: fechaConsulta, total: totalCaja, ventas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar el cuadre de caja' });
    }
};