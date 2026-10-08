import { Router } from 'express';
import { obtenerPlatos, crear, actualizar, eliminar } from '../controllers/platoController.js';
import { verificarToken, autorizarRoles} from '../middleware/authMiddleware.js';
import { validarEsquema } from '../middleware/validarEsquema.js';
import { crearPlatoSchema, actualizarPlatoSchema } from '../validators/platoSchemas.js';

const router = Router();

// Ruta pública (clientes viendo el e-commerce)
router.get('/', obtenerPlatos);

// Rutas protegidas (solo la dueña/administrador puede usarlas)
router.post(
    '/',
    verificarToken,
    autorizarRoles('Administradora'),
    validarEsquema(crearPlatoSchema),
    crear
);

router.put(
    '/:id',
    verificarToken,
    autorizarRoles('Administradora'),
    validarEsquema(actualizarPlatoSchema),
    actualizar
);

router.delete(
    '/:id',
    verificarToken,
    autorizarRoles('Administradora'),
    eliminar
);
export default router;