// dlidia-frontend/lib/socket.js
import { io } from 'socket.io-client';
import { API_URL } from './api';

export const socket = io(API_URL, {
    autoConnect: false // Se conectará solo cuando el cajero/motorizado abra la pantalla
});