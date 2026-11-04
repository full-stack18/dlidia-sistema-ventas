import { Router } from 'express';
import { registrarCliente } from '../controllers/clienteController.js';

const router = Router();

// Ruta pública para que el E-commerce consulte o registre clientes
router.post('/', registrarCliente);

export default router;