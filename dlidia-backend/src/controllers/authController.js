import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as usuarioRepository from '../repositories/usuarioRepository.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
        }

        const usuario = await usuarioRepository.buscarUsuarioPorUsername(username);
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

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