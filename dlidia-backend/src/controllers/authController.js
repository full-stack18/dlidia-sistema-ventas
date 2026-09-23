import jwt from 'jsonwebtoken';
import * as usuarioRepository from '../repositories/usuarioRepository.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const usuario = await usuarioRepository.buscarUsuarioPorUsername(username);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // 👉 AQUÍ ES DONDE DEBE IR EL TOKEN (porque aquí "usuario" ya existe)
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
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