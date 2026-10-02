import { Router } from 'express';
import {
    crearPedido,
    obtenerPedidos,
    actualizarEstado,
    obtenerDelivery,
    cuadreDeCaja,
    consultarEstadoPublico,
    obtenerMotorizados,
    asignarMotorizado,
    obtenerPedidosPendientesDePago,
    registrarCierreCaja
} from '../controllers/pedidoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { registrarPago } from '../controllers/pagoController.js';

const router = Router();

// Públicas
router.post('/', crearPedido);
router.get('/estado/:id', consultarEstadoPublico); // solo devuelve el estado, sin PII de otros

// Protegidas (personal autenticado)
router.get('/', verificarToken, obtenerPedidos);
router.get('/caja', verificarToken, cuadreDeCaja);
router.post('/caja/cierre', verificarToken, registrarCierreCaja);
router.get(
    '/caja/pendientes-pago',
    verificarToken,
    obtenerPedidosPendientesDePago
);
router.get('/delivery', verificarToken, obtenerDelivery);
router.get('/motorizados', verificarToken, obtenerMotorizados);
router.put('/:id/asignar', verificarToken, asignarMotorizado);
router.put('/:id', verificarToken, actualizarEstado);
router.post('/:id/pagos', verificarToken, registrarPago);

export default router;