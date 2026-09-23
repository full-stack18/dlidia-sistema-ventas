import * as platoRepository from '../repositories/platoRepository.js';

export const obtenerPlatos = async (req, res) => {
    try {
        const platos = await platoRepository.obtenerPlatosActivos();
        res.status(200).json(platos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el catálogo de platos' });
    }
};

export const crear = async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria } = req.body;
        const nuevoPlato = await platoRepository.crearPlato(nombre, descripcion, precio, categoria);
        res.status(201).json(nuevoPlato);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el plato' });
    }
};

export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria } = req.body;
        const platoEditado = await platoRepository.actualizarPlato(id, nombre, descripcion, precio, categoria);
        res.status(200).json(platoEditado);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el plato' });
    }
};

export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        await platoRepository.eliminarPlato(id);
        res.status(200).json({ mensaje: 'Plato eliminado (ocultado) con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el plato' });
    }
};