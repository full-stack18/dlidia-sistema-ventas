import pool from '../config/db.js';

export const obtenerPlatosActivos = async () => {
    const query = 'SELECT * FROM platos WHERE disponible = true ORDER BY categoria, nombre;';
    const result = await pool.query(query);
    return result.rows;
};

export const crearPlato = async (nombre, descripcion, precio, categoria, imagen_url) => {
    const query = 'INSERT INTO platos (nombre, descripcion, precio, categoria, imagen_url, disponible) VALUES ($1, $2, $3, $4, $5, true) RETURNING *;';
    // Si no envían imagen, le ponemos la de por defecto
    const img = imagen_url || '/platos/default.jpg'; 
    const result = await pool.query(query, [nombre, descripcion, precio, categoria, img]);
    return result.rows[0];
};

export const actualizarPlato = async (id, nombre, descripcion, precio, categoria, imagen_url) => {
    const query = 'UPDATE platos SET nombre = $1, descripcion = $2, precio = $3, categoria = $4, imagen_url = $5 WHERE id = $6 RETURNING *;';
    const result = await pool.query(query, [nombre, descripcion, precio, categoria, imagen_url, id]);
    return result.rows[0];
};

export const eliminarPlato = async (id) => {
    // En lugar de borrarlo físicamente, lo marcamos como "no disponible" para no romper el historial de pedidos
    const query = 'UPDATE platos SET disponible = false WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};