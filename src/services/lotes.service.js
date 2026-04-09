const pool = require('../config/db');

const lotesService = {
     
    async getAll(estado, usuario_id) {
        let query = 'SELECT * FROM lotes WHERE usuario_id = $1';
        const params = [usuario_id];
        let paramIndex = 2;

        if (estado) {
            query += ` AND estado = $${paramIndex++}`;
            params.push(estado);
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    },

   
    async getById(id, usuario_id) {
        const loteResult = await pool.query('SELECT * FROM lotes WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);

        if (loteResult.rows.length === 0) {
            const error = new Error('Lote no encontrado');
            error.statusCode = 404;
            throw error;
        }

        const productosResult = await pool.query(
            'SELECT p.*, s.nombre as subcategoria_nombre FROM productos p LEFT JOIN categorias s ON p.subcategoria_id = s.id WHERE p.lote_id = $1 AND p.usuario_id = $2 ORDER BY p.created_at DESC',
            [id, usuario_id]
        );

        return {
            ...loteResult.rows[0],
            productos: productosResult.rows,
        };
    },

    async create(data) {
        const { codigo, nombre, fecha_compra, precio_total, gastos_adicionales, piezas_total, usuario_id } = data;

        const result = await pool.query(
            `INSERT INTO lotes (usuario_id, codigo, nombre, fecha_compra, precio_total, gastos_adicionales, piezas_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [usuario_id, codigo, nombre, fecha_compra, precio_total, gastos_adicionales || 0, piezas_total]
        );

        return result.rows[0];
    },

    /**
     * Actualizar un lote existente.
     */
    async update(id, data, usuario_id) {
        const { nombre, estado } = data;

        // Construir query dinámico
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (nombre !== undefined) {
            fields.push(`nombre = $${paramIndex++}`);
            values.push(nombre);
        }
        if (estado !== undefined) {
            fields.push(`estado = $${paramIndex++}`);
            values.push(estado);
        }

        if (fields.length === 0) {
            const error = new Error('No se proporcionaron campos para actualizar');
            error.statusCode = 400;
            throw error;
        }

        fields.push(`updated_at = NOW()`);
        
        // Add id and usuario_id to values
        values.push(id);
        const idIndex = paramIndex++;
        values.push(usuario_id);
        const userIndex = paramIndex++;

        const result = await pool.query(
            `UPDATE lotes SET ${fields.join(', ')} WHERE id = $${idIndex} AND usuario_id = $${userIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            const error = new Error('Lote no encontrado o no autorizado');
            error.statusCode = 404;
            throw error;
        }

        return result.rows[0];
    },
};

module.exports = lotesService;
