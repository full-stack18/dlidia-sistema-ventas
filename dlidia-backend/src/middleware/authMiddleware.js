import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Debe ser exactamente la misma clave que usaste en authController.js
dotenv.config();

export const verificarToken = (req, res, next) => {
    // 1. Extraer el token de la cabecera de la petición
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer <token>"

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado: No se proporcionó un token de seguridad' });
    }

    try {
        // 2. Verificar que el token sea auténtico y no haya expirado
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        
        // 4. Dar permiso para continuar hacia la ruta solicitada
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};