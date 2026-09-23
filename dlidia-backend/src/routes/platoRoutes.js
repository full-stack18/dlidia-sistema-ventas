import { Router } from 'express';
import { obtenerPlatos, crear, actualizar, eliminar } from '../controllers/platoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Ruta pública (clientes viendo el e-commerce)
router.get('/', obtenerPlatos);

// Rutas protegidas (solo la dueña/administrador puede usarlas)
router.post('/', verificarToken, crear);
router.put('/:id', verificarToken, actualizar);
router.delete('/:id', verificarToken, eliminar);

export default router;