import pool from '../config/db.js';

export const buscarUsuarioPorUsername = async (username) => {
    const query = 'SELECT * FROM usuarios WHERE username = $1;';
    const result = await pool.query(query, [username]);
    return result.rows[0];
};