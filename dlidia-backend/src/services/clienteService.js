import * as clienteRepository from '../repositories/clienteRepository.js';

export const procesarCliente = async (nombre, telefono, direccion) => {
    // 1. Verificar si el cliente ya existe en la base de datos por su teléfono
    let cliente = await clienteRepository.buscarPorTelefono(telefono);

    // 2. Si es un cliente nuevo, lo registramos
    if (!cliente) {
        cliente = await clienteRepository.crearCliente(nombre, telefono);
    }

    // 3. Si el pedido incluye una dirección (ej. Delivery), gestionamos sus ubicaciones
    if (direccion) {
        const direccionExistente = await clienteRepository.buscarDireccion(cliente.id, direccion);
        
        // Solo guardamos la dirección si es nueva para este cliente específico
        if (!direccionExistente) {
            await clienteRepository.agregarDireccion(cliente.id, direccion);
        }
    }

    return cliente;
};