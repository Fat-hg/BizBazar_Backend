const pool = require('../config/db');

const configuracionService = {
    async getNegocio() {
        const result = await pool.query('SELECT * FROM negocio LIMIT 1');
        // Si no existe, deberíamos crear uno por defecto según el schema
        if (result.rows.length === 0) {
            const defaultResult = await pool.query(
                `INSERT INTO negocio (nombre) VALUES ('BizBazar') RETURNING *`
            );
            return defaultResult.rows[0];
        }
        return result.rows[0];
    },

    async updateNegocio(data) {
        const negocio = await configuracionService.getNegocio(); // Asegurar que exista

        const allowedFields = ['nombre', 'telefono', 'email_contacto', 'direccion', 'moneda', 'incremento_minimo_subasta', 'formato_codigo'];
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramIndex++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return negocio;

        fields.push(`updated_at = NOW()`);
        values.push(negocio.id);

        const result = await pool.query(
            `UPDATE negocio SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0];
    },

    async ensureCategoriasTable() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
    },

    async getCategorias(tipo) {
        await configuracionService.ensureCategoriasTable();
        let query = 'SELECT * FROM categorias';
        let params = [];
        if (tipo) {
            query += ' WHERE tipo = $1';
            params.push(tipo);
        }
        query += ' ORDER BY created_at ASC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    async createCategoria(data) {
        await configuracionService.ensureCategoriasTable();
        const result = await pool.query(
            'INSERT INTO categorias (nombre, tipo) VALUES ($1, $2) RETURNING *',
            [data.nombre, data.tipo]
        );
        return result.rows[0];
    },

    async deleteCategoria(id) {
        await configuracionService.ensureCategoriasTable();
        await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
        return true;
    }
};

module.exports = configuracionService;
