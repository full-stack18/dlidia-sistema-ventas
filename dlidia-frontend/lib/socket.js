import { io } from 'socket.io-client';
import { API_URL } from './api';

export const socket = io(API_URL, {
    autoConnect: false,
    auth: (callback) => {
        const token =
            typeof window !== 'undefined'
                ? localStorage.getItem('dlidia_token')
                : null;

        callback(token ? { token } : {});
    }
});