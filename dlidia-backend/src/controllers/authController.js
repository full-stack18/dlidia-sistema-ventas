import jwt from 'jsonwebtoken';
import * as usuarioRepository from '../repositories/usuarioRepository.js';

// En producción, esta clave secreta debe ir en tu archivo .env
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const usuario = await usuarioRepository.buscarUsuarioPorUsername(username);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Creamos el token con los datos del usuario (sin incluir la contraseña)
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, rol: usuario.rol }, 
            SECRET_KEY, 
            { expiresIn: '8h' } // El token expira al terminar el turno (8 horas)
        );

        res.status(200).json({
            mensaje: 'Autenticación exitosa',
            token,
            usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor durante el login' });
    }
};