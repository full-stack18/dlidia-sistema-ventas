import { Router } from 'express';
import {
    crearPedido,
    obtenerPedidos,
    actualizarEstado,
    obtenerDelivery,
    cuadreDeCaja,
    obtenerAnulacionesCaja,
    consultarEstadoPublico,
    obtenerMotorizados,
    asignarMotorizado,
    obtenerPedidosPendientesDePago,
    registrarCierreCaja,
    obtenerHistorialCierresCaja
} from '../controllers/pedidoController.js';
import { verificarToken, autorizarRoles } from '../middleware/authMiddleware.js';
import { registrarPago } from '../controllers/pagoController.js';
import { validarEsquema } from '../middleware/validarEsquema.js';
import { actualizarEstadoPedidoSchema, crearPedidoSchema } from '../validators/pedidoSchemas.js';

const router = Router();

// Públicas
router.post('/', validarEsquema(crearPedidoSchema), crearPedido);
router.get('/estado/:id', consultarEstadoPublico); // solo devuelve el estado, sin PII de otros

// Protegidas (personal autenticado)
router.get('/', verificarToken, autorizarRoles('Cajero', 'Administradora', 'Cocina'), obtenerPedidos);
router.get('/caja', verificarToken, autorizarRoles('Cajero', 'Administradora'), cuadreDeCaja);
router.get('/caja/anulaciones', verificarToken, autorizarRoles('Cajero', 'Administradora'), obtenerAnulacionesCaja);
router.post('/caja/cierre', verificarToken, autorizarRoles('Cajero', 'Administradora'), registrarCierreCaja);
router.get('/caja/cierres', verificarToken, autorizarRoles('Cajero', 'Administradora'), obtenerHistorialCierresCaja);
router.get('/caja/pendientes-pago', verificarToken, autorizarRoles('Cajero', 'Administradora'), obtenerPedidosPendientesDePago);
router.get('/delivery', verificarToken, autorizarRoles('Motorizado'), obtenerDelivery);
router.get('/motorizados', verificarToken, autorizarRoles('Administradora'), obtenerMotorizados);
router.put('/:id/asignar', verificarToken, autorizarRoles('Administradora'), asignarMotorizado);
router.put('/:id', verificarToken, validarEsquema(actualizarEstadoPedidoSchema), actualizarEstado);
router.post('/:id/pagos', verificarToken, autorizarRoles('Cajero', 'Administradora'), registrarPago);
export default router;