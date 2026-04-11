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
      LEFT JOIN categorias s ON p.subcategoria_id = s.id
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
       LEFT JOIN categorias s ON p.subcategoria_id = s.id
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

        // ==========================================
        // LÓGICA ROBUSTA PARA SUBCATEGORÍA
        // ==========================================
        let validSubcatId = null;
        if (subcategoria_id) {
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
            const isUUID = uuidRegex.test(subcategoria_id);

            if (isUUID) {
                // Verificar si existe en DB
                const catExist = await pool.query('SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2', [subcategoria_id, usuario_id]);
                if (catExist.rows.length > 0) validSubcatId = catExist.rows[0].id;
            }

            if (!validSubcatId) {
                // No es UUID o es un UUID viejo/inexistente. 
                // Usamos el texto recibido o un fallback para buscar o crear la categoría.
                const nombreSubcat = isUUID ? (data.subcategoria || 'General') : subcategoria_id;
                
                const catResult = await pool.query('SELECT id FROM categorias WHERE nombre ILIKE $1 AND usuario_id = $2 AND tipo = $3', [nombreSubcat, usuario_id, categoria]);
                if (catResult.rows.length > 0) {
                    validSubcatId = catResult.rows[0].id;
                } else {
                    const newCat = await pool.query('INSERT INTO categorias (nombre, usuario_id, tipo) VALUES ($1, $2, $3) RETURNING id', [nombreSubcat, usuario_id, categoria]);
                    validSubcatId = newCat.rows[0].id;
                }
            }
        }
        // ==========================================

        const result = await pool.query(
            `INSERT INTO productos (usuario_id, codigo, nombre, descripcion, categoria, subcategoria_id, tipo_venta, lote_id, costo_base, imagenes, premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [
                usuario_id, codigo, nombre, descripcion || null, categoria, validSubcatId,
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
        const allowedFields = ['nombre', 'descripcion', 'categoria', 'subcategoria_id', 'tipo_venta', 'lote_id', 'costo_base', 'estado', 'imagenes', 'premium'];
        
        // ==========================================
        // LÓGICA ROBUSTA PARA SUBCATEGORÍA (UPDATE)
        // ==========================================
        if (data.subcategoria_id !== undefined) {
            const subId = data.subcategoria_id;
            let validSubcatUpdateId = null;
            if (subId) {
                const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(subId);
                if (isUUID) {
                    const catExist = await pool.query('SELECT id FROM categorias WHERE id = $1 AND usuario_id = $2', [subId, usuario_id]);
                    if (catExist.rows.length > 0) validSubcatUpdateId = catExist.rows[0].id;
                }
                
                if (!validSubcatUpdateId) {
                    // Determinar el tipo de categoría a buscar (o usar actual si no se provee)
                    const tipoCat = data.categoria || 'ropa'; 
                    const nombreSubcat = isUUID ? (data.subcategoria || 'General') : subId;
                    const catResult = await pool.query('SELECT id FROM categorias WHERE nombre ILIKE $1 AND usuario_id = $2 AND tipo = $3', [nombreSubcat, usuario_id, tipoCat]);
                    
                    if (catResult.rows.length > 0) {
                        validSubcatUpdateId = catResult.rows[0].id;
                    } else {
                        const newCat = await pool.query('INSERT INTO categorias (nombre, usuario_id, tipo) VALUES ($1, $2, $3) RETURNING id', [nombreSubcat, usuario_id, tipoCat]);
                        validSubcatUpdateId = newCat.rows[0].id;
                    }
                }
            }
            data.subcategoria_id = validSubcatUpdateId;
        }

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
