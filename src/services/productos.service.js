const pool = require('../config/db');

const productosService = {
    /**
     * Listar productos con filtros opcionales.
     */
    async getAll({ categoria, estado, search }, usuario_id) {
        let query = `
      SELECT p.*, 
             s.nombre as subcategoria_nombre,
             l.nombre as lote_nombre,
             l.codigo as lote_codigo
      FROM productos p
      LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
      LEFT JOIN lotes l ON p.lote_id = l.id
      WHERE p.usuario_id = $1
    `;
        const params = [usuario_id];
        let paramIndex = 2;

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
    async getById(id, usuario_id) {
        const result = await pool.query(
            `SELECT p.*, 
              s.nombre as subcategoria_nombre,
              l.nombre as lote_nombre,
              l.codigo as lote_codigo
       FROM productos p
       LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
       LEFT JOIN lotes l ON p.lote_id = l.id
       WHERE p.id = $1 AND p.usuario_id = $2`,
            [id, usuario_id]
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
        if (data.subcategoria_id) {
            try {
                const check = await pool.query("SELECT id FROM subcategorias WHERE id = $1", [data.subcategoria_id]);
                if (check.rows.length === 0) {
                    data.subcategoria_id = null; // ID inválido o obsoleto
                }
            } catch (error) {
                data.subcategoria_id = null; // Formato UUID inválido u otro error
            }
        }

        const {
            codigo, nombre, descripcion, categoria, subcategoria_id,
            tipo_venta, lote_id, costo_base, imagenes, premium, usuario_id
        } = data;

        // Validar constraint: si categoria=ropa entonces lote_id requerido
        if (categoria === 'ropa' && !lote_id) {
            const error = new Error('Para categoría "ropa", el lote_id es requerido');
            error.statusCode = 400;
            throw error;
        }

        const result = await pool.query(
            `INSERT INTO productos (usuario_id, codigo, nombre, descripcion, categoria, subcategoria_id, tipo_venta, lote_id, costo_base, imagenes, premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [
                usuario_id, codigo, nombre, descripcion || null, categoria, subcategoria_id || null,
                tipo_venta, lote_id || null, costo_base, imagenes && imagenes.length ? JSON.stringify(imagenes) : '[]',
                premium || false
            ]
        );

        return result.rows[0];
    },

    /**
     * Actualizar un producto existente.
     */
    async update(id, data, usuario_id) {
        if (data.subcategoria_id) {
            try {
                const check = await pool.query("SELECT id FROM subcategorias WHERE id = $1", [data.subcategoria_id]);
                if (check.rows.length === 0) {
                    data.subcategoria_id = null;
                }
            } catch (error) {
                data.subcategoria_id = null;
            }
        }

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
        const idIndex = paramIndex++;
        values.push(usuario_id);
        const userIndex = paramIndex++;

        const result = await pool.query(
            `UPDATE productos SET ${fields.join(', ')} WHERE id = $${idIndex} AND usuario_id = $${userIndex} RETURNING *`,
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
    async delete(id, usuario_id) {
        const result = await pool.query(
            'DELETE FROM productos WHERE id = $1 AND usuario_id = $2 RETURNING *',
            [id, usuario_id]
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
