import * as clienteService from '../services/clienteService.js';

export const registrarCliente = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        
        // Validación básica
        if (!telefono) {
            return res.status(400).json({ error: 'El teléfono es obligatorio' });
        }

        // Llamamos al servicio para aplicar las reglas de negocio
        const clienteProcesado = await clienteService.procesarCliente(nombre, telefono, direccion);

        res.status(200).json({
            mensaje: 'Cliente procesado exitosamente',
            cliente: clienteProcesado
        });
    } catch (error) {
        console.error('Error al registrar cliente:', error);
        res.status(500).json({ error: 'Error interno al procesar el cliente' });
    }
};