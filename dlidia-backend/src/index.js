import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import pool from './config/db.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import platoRoutes from './routes/platoRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

app.use(cors());
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
        res.status(500).json({ error: 'Error conectando a PostgreSQL', detalle: error.message });
    }
});

// Eventos de WebSockets
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado a Socket.io:', socket.id);
    socket.on('disconnect', () => console.log('Cliente desconectado'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Servidor API REST y WebSockets corriendo en http://localhost:${PORT}`);
});