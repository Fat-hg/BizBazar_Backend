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
        const negocio = await this.getNegocio(); // Asegurar que exista

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
    }
};

module.exports = configuracionService;
