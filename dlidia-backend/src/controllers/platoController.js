import * as platoRepository from '../repositories/platoRepository.js';

const crearErrorNoEncontrado = () => {
    const error = new Error('Plato no encontrado');
    error.status = 404;
    return error;
};

export const obtenerPlatos = async (req, res, next) => {
    try {
        const platos = await platoRepository.obtenerPlatosActivos();
        return res.status(200).json(platos);
    } catch (error) {
        next(error);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre, descripcion, precio, categoria, imagen_url } = req.body;

        const nuevoPlato = await platoRepository.crearPlato(
            nombre,
            descripcion,
            precio,
            categoria,
            imagen_url
        );

        return res.status(201).json(nuevoPlato);
    } catch (error) {
        next(error);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria, imagen_url } = req.body;

        const platoEditado = await platoRepository.actualizarPlato(
            id,
            nombre,
            descripcion,
            precio,
            categoria,
            imagen_url
        );

        if (!platoEditado) {
            throw crearErrorNoEncontrado();
        }

        return res.status(200).json(platoEditado);
    } catch (error) {
        next(error);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const platoEliminado = await platoRepository.eliminarPlato(id);

        if (!platoEliminado) {
            throw crearErrorNoEncontrado();
        }

        return res.status(200).json({
            mensaje: 'Plato eliminado (ocultado) con éxito'
        });
    } catch (error) {
        next(error);
    }
};