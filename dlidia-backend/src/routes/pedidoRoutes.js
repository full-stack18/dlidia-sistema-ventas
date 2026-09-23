import { Router } from 'express';
import {
    crearPedido,
    obtenerPedidos,
    actualizarEstado,
    obtenerDelivery,
    cuadreDeCaja,
    consultarEstadoPublico
} from '../controllers/pedidoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Públicas
router.post('/', crearPedido);
router.get('/estado/:id', consultarEstadoPublico); // solo devuelve el estado, sin PII de otros

// Protegidas (personal autenticado)
router.get('/', verificarToken, obtenerPedidos);
router.get('/caja', verificarToken, cuadreDeCaja);
router.get('/delivery', verificarToken, obtenerDelivery);
router.put('/:id', verificarToken, actualizarEstado);

export default router;