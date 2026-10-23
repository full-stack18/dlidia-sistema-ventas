import { Router } from 'express';
import { obtenerAnalisis } from '../controllers/analiticaController.js';
import {
    verificarToken,
    autorizarRoles
} from '../middleware/authMiddleware.js';

const router = Router();

router.get(
    '/resumen',
    verificarToken,
    autorizarRoles('Administradora'),
    obtenerAnalisis
);

export default router;