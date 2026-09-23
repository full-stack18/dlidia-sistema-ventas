import pool from '../config/db.js';

export const obtenerPlatosActivos = async () => {
    const query = 'SELECT * FROM platos WHERE disponible = true ORDER BY categoria, nombre;';
    const result = await pool.query(query);
    return result.rows;
};

export const crearPlato = async (nombre, descripcion, precio, categoria) => {
    const query = 'INSERT INTO platos (nombre, descripcion, precio, categoria, disponible) VALUES ($1, $2, $3, $4, true) RETURNING *;';
    const result = await pool.query(query, [nombre, descripcion, precio, categoria]);
    return result.rows[0];
};

export const actualizarPlato = async (id, nombre, descripcion, precio, categoria) => {
    const query = 'UPDATE platos SET nombre = $1, descripcion = $2, precio = $3, categoria = $4 WHERE id = $5 RETURNING *;';
    const result = await pool.query(query, [nombre, descripcion, precio, categoria, id]);
    return result.rows[0];
};

export const eliminarPlato = async (id) => {
    // En lugar de borrarlo físicamente, lo marcamos como "no disponible" para no romper el historial de pedidos
    const query = 'UPDATE platos SET disponible = false WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};