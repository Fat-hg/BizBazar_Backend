const pool = require('../config/db');

const configuracionService = {
    async getNegocio(usuario_id) {
        const result = await pool.query('SELECT * FROM negocio WHERE usuario_id = $1 LIMIT 1', [usuario_id]);
        if (result.rows.length === 0) {
            const defaultResult = await pool.query(
                `INSERT INTO negocio (usuario_id, nombre) VALUES ($1, 'BizBazar') RETURNING *`,
                [usuario_id]
            );
            return defaultResult.rows[0];
        }
        return result.rows[0];
    },

    async updateNegocio(data, usuario_id) {
        let negocio = await configuracionService.getNegocio(usuario_id);

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
        const idIndex = paramIndex++;
        values.push(usuario_id);
        const userIndex = paramIndex++;

        const result = await pool.query(
            `UPDATE negocio SET ${fields.join(', ')} WHERE id = $${idIndex} AND usuario_id = $${userIndex} RETURNING *`,
            values
        );

        return result.rows[0] || negocio;
    },

    async ensureCategoriasTable() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
    },

    async getCategorias(tipo, usuario_id) {
        await configuracionService.ensureCategoriasTable();
        let query = 'SELECT * FROM categorias WHERE usuario_id = $1';
        let params = [usuario_id];
        if (tipo) {
            query += ' AND tipo = $2';
            params.push(tipo);
        }
        query += ' ORDER BY created_at ASC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    async createCategoria(data, usuario_id) {
        await configuracionService.ensureCategoriasTable();
        const result = await pool.query(
            'INSERT INTO categorias (usuario_id, nombre, tipo) VALUES ($1, $2, $3) RETURNING *',
            [usuario_id, data.nombre, data.tipo]
        );
        return result.rows[0];
    },

    async deleteCategoria(id, usuario_id) {
        await configuracionService.ensureCategoriasTable();
        await pool.query('DELETE FROM categorias WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
        return true;
    }
};

module.exports = configuracionService;
