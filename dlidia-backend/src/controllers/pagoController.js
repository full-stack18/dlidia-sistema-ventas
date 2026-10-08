import * as pagoService from '../services/pagoService.js';

export const registrarPago = async (req, res, next) => {
    try {
        if (!['Cajero', 'Administradora'].includes(req.usuario.rol)) {
            return res.status(403).json({
                error: 'Solo Cajero o Administradora pueden registrar pagos'
            });
        }

        const pago = await pagoService.registrarPago({
            pedidoId: req.params.id,
            metodoPago: req.body.metodoPago,
            usuarioId: req.usuario.id,
            referencia: req.body.referencia
        });

        return res.status(201).json({
            mensaje: 'Pago registrado exitosamente',
            pago
        });
    } catch (error) {
        next(error);
    }
};