import { Router } from 'express';
import { crearPedido, obtenerPedidos, actualizarEstado, obtenerDelivery, cuadreDeCaja } from '../controllers/pedidoController.js';
import { verificarToken } from '../middleware/authMiddleware.js'; // Importamos el guardia

const router = Router();

// Rutas Públicas (El cliente web no necesita token para ver el catálogo o crear un pedido)
router.get('/', obtenerPedidos);
router.post('/', crearPedido);

// Rutas Protegidas (Solo accesibles con Token JWT válido)
router.get('/caja', verificarToken, cuadreDeCaja);
router.get('/delivery', verificarToken, obtenerDelivery); 
router.put('/:id', verificarToken, actualizarEstado);

export default router;