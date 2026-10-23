import * as analiticaService from '../services/analiticaService.js';

export const obtenerAnalisis = async (req, res, next) => {
    try {
        const hoyLima = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const desde = req.query.desde || hoyLima;
        const hasta = req.query.hasta || desde;

        const analisis = await analiticaService.consultarAnalisis(
            desde,
            hasta,
            req.usuario?.rol
        );

        return res.status(200).json({
            desde,
            hasta,
            ...analisis
        });
    } catch (error) {
        next(error);
    }
};