import pool from '../config/db.js';

// Buscar un cliente por su número de teléfono
export const buscarPorTelefono = async (telefono) => {
    const query = 'SELECT * FROM clientes WHERE telefono = $1;';
    const result = await pool.query(query, [telefono]);
    return result.rows[0];
};

// Crear un nuevo cliente
export const crearCliente = async (nombre, telefono) => {
    const query = `
        INSERT INTO clientes (nombre, telefono, fecha_registro) 
        VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *;
    `;
    const result = await pool.query(query, [nombre, telefono]);
    return result.rows[0];
};

// Registrar una nueva dirección para un cliente
export const agregarDireccion = async (cliente_id, direccion) => {
    const query = `
        INSERT INTO direcciones_clientes (cliente_id, direccion) 
        VALUES ($1, $2) RETURNING *;
    `;
    const result = await pool.query(query, [cliente_id, direccion]);
    return result.rows[0];
};

// Buscar si el cliente ya tiene esa dirección registrada
export const buscarDireccion = async (cliente_id, direccion) => {
    const query = 'SELECT * FROM direcciones_clientes WHERE cliente_id = $1 AND direccion = $2;';
    const result = await pool.query(query, [cliente_id, direccion]);
    return result.rows[0];
};