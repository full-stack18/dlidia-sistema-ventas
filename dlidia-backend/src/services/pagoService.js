import { registrarPagoConfirmado } from '../repositories/pagoRepository.js';

export const registrarPago = async ({
    pedidoId,
    metodoPago,
    usuarioId,
    referencia
}) => {
    return registrarPagoConfirmado({
        pedidoId,
        metodoPago,
        usuarioId,
        referencia
    });
};