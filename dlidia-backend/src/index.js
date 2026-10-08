import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pool from './config/db.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import platoRoutes from './routes/platoRoutes.js';
import authRoutes from './routes/authRoutes.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const ORIGEN_PERMITIDO = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOptions = {
    origin: ORIGEN_PERMITIDO,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
const io = new Server(httpServer, {
    cors: corsOptions
});
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    // El seguimiento del cliente puede conectarse sin iniciar sesión.
    // Sin token, no se le asignan salas internas.
    if (!token) {
        socket.data.usuario = null;
        return next();
    }

    try {
        socket.data.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        next(new Error('Token inválido o expirado'));
    }
});
app.use(express.json());
// Middleware para inyectar io en el objeto req
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/platos', platoRoutes);
app.use('/api/auth', authRoutes);


// Endpoint de prueba para verificar la conexión a la base de datos
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'OK', db_time: result.rows[0].now });
    } catch (error) {
        res.status(500).json({ error: 'Error conectando a PostgreSQL'});
    }
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const status = Number.isInteger(error.status) ? error.status : 500;

    // Los errores internos reciben un mensaje genérico.
    const mensaje =
        status >= 500
            ? 'Error interno del servidor'
            : error.message || 'Solicitud no válida';

    // Registrar solo información básica; no imprimir tokens, contraseñas ni datos del pedido.
    console.error('[API]', {
        metodo: req.method,
        ruta: req.path,
        estado: status,
        tipo: error.name
    });

    res.status(status).json({ error: mensaje });
});



// Eventos de WebSockets
io.on('connection', (socket) => {
    const usuario = socket.data.usuario;

    if (usuario) {
        socket.join(`role:${usuario.rol}`);
        socket.join(`user:${usuario.id}`);
        console.log(`Socket autenticado: ${usuario.rol}`);
    } else {
        console.log('Socket público conectado para seguimiento');
    }

    socket.on('seguir_pedido', async (idPedido, responder) => {
        const enviarRespuesta =
            typeof responder === 'function' ? responder : () => {};

        const id = Number(idPedido);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return enviarRespuesta({ ok: false });
        }

        try {
            const resultado = await pool.query(
                `SELECT id, estado, tipo_entrega
                 FROM pedidos
                 WHERE id = $1`,
                [id]
            );

            const pedido = resultado.rows[0];

            if (!pedido) {
                return enviarRespuesta({ ok: false });
            }

            await socket.join(`pedido:${id}`);
            enviarRespuesta({ ok: true, pedido });
        } catch {
            enviarRespuesta({ ok: false });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Servidor API REST y WebSockets corriendo en http://localhost:${PORT}`);
});