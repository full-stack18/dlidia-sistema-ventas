// dlidia-frontend/lib/socket.js
import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
    autoConnect: false // Se conectará solo cuando el cajero abra la pantalla
});