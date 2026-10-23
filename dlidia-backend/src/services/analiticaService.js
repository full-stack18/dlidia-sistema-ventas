import * as analiticaRepository from '../repositories/analiticaRepository.js';

const esFechaValida = (fecha) => {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const fechaUtc = new Date(`${fecha}T00:00:00.000Z`);

    return (
        !Number.isNaN(fechaUtc.getTime()) &&
        fechaUtc.toISOString().slice(0, 10) === fecha
    );
};

const validarRangoFechas = (desde, hasta) => {
    if (!esFechaValida(desde) || !esFechaValida(hasta)) {
        const error = new Error(
            'Desde y hasta deben ser fechas válidas con formato AAAA-MM-DD'
        );
        error.status = 400;
        throw error;
    }

    if (desde > hasta) {
        const error = new Error(
            'La fecha inicial no puede ser posterior a la fecha final'
        );
        error.status = 400;
        throw error;
    }
};

export const consultarAnalisis = async (desde, hasta, usuarioRol) => {
    if (usuarioRol !== 'Administradora') {
        const error = new Error(
            'Solo la Administradora puede consultar el panel de análisis'
        );
        error.status = 403;
        throw error;
    }

    validarRangoFechas(desde, hasta);

    return await analiticaRepository.obtenerAnalisisVentas(desde, hasta);
};