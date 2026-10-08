import { rateLimit } from 'express-rate-limit';

export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5, // máximo 5 intentos desde una IP dentro del período
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
    }
});