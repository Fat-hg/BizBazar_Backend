const pool = require('../config/db');

const productosService = {
    /**
     * Listar productos con filtros opcionales.
     */
    async getAll({ categoria, estado, search }) {
        let query = `
      SELECT p.*, 
             s.nombre as subcategoria_nombre,
             l.nombre as lote_nombre,
             l.codigo as lote_codigo
      FROM productos p
      LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
      LEFT JOIN lotes l ON p.lote_id = l.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (categoria) {
            query += ` AND p.categoria = $${paramIndex++}`;
            params.push(categoria);
        }

        if (estado) {
            query += ` AND p.estado = $${paramIndex++}`;
            params.push(estado);
        }

        if (search) {
            query += ` AND (p.nombre ILIKE $${paramIndex} OR p.codigo ILIKE $${paramIndex} OR p.descripcion ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY p.created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    /**
     * Obtener producto por ID con detalle completo.
     */
    async getById(id) {
        const result = await pool.query(
            `SELECT p.*, 
              s.nombre as subcategoria_nombre,
              l.nombre as lote_nombre,
              l.codigo as lote_codigo
       FROM productos p
       LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
       LEFT JOIN lotes l ON p.lote_id = l.id
       WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404;
            throw error;
        }

        return result.rows[0];
    },

    /**
     * Crear un nuevo producto.
     */
    async create(data) {
        const {
            codigo, nombre, descripcion, categoria, subcategoria_id,
            tipo_venta, lote_id, costo_base, imagenes, premium
        } = data;

        // Validar constraint: si categoria=ropa entonces lote_id requerido
        if (categoria === 'ropa' && !lote_id) {
            const error = new Error('Para categoría "ropa", el lote_id es requerido');
            error.statusCode = 400;
            throw error;
        }

        const result = await pool.query(
            `INSERT INTO productos (codigo, nombre, descripcion, categoria, subcategoria_id, tipo_venta, lote_id, costo_base, imagenes, premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                codigo, nombre, descripcion || null, categoria, subcategoria_id || null,
                tipo_venta, lote_id || null, costo_base, imagenes && imagenes.length ? JSON.stringify(imagenes) : '[]',
                premium || false
            ]
        );

        return result.rows[0];
    },

    /**
     * Actualizar un producto existente.
     */
    async update(id, data) {
        const allowedFields = ['nombre', 'descripcion', 'categoria', 'subcategoria_id', 'tipo_venta', 'lote_id', 'costo_base', 'estado', 'imagenes', 'premium'];
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                if (field === 'imagenes') {
                    fields.push(`${field} = $${paramIndex++}`);
                    values.push(JSON.stringify(data[field]));
                } else {
                    fields.push(`${field} = $${paramIndex++}`);
                    values.push(data[field]);
                }
            }
        }

        if (fields.length === 0) {
            const error = new Error('No se proporcionaron campos para actualizar');
            error.statusCode = 400;
            throw error;
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE productos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404;
            throw error;
        }

        return result.rows[0];
    },

    /**
     * Eliminar un producto.
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            const error = new Error('Producto no encontrado para eliminar');
            error.statusCode = 404;
            throw error;
        }

        return result.rows[0];
    },
};

module.exports = productosService;
