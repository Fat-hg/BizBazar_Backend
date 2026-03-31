const pool = require('../config/db');
const { getNext } = require('../utils/generateCode');

const subastasService = {
    /**
     * Listar subastas con filtro opcional de estado.
     */
    async getAll(estado, usuario_id) {
        let query = `
      SELECT s.*, 
             p.nombre as producto_nombre, 
             p.codigo as producto_codigo,
             p.categoria as producto_categoria,
             p.imagenes as producto_imagenes
      FROM subastas s
      JOIN productos p ON s.producto_id = p.id
      WHERE s.usuario_id = $1
    `;
        const params = [usuario_id];
        let paramIndex = 2;

        if (estado) {
            query += ` AND s.estado = $${paramIndex++}`;
            params.push(estado);
        }

        query += ' ORDER BY s.created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    },

    /**
     * Crear una nueva subasta.
     * - Genera código SUB001, SUB002...
     * - Cambia producto.estado = 'en_subasta'
     */
    async create(data) {
        const { producto_id, precio_inicial, incremento_minimo, usuario_id } = data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Validar producto existe y está disponible
            const productoResult = await client.query(
                'SELECT id, nombre, estado FROM productos WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
                [producto_id, usuario_id]
            );

            if (productoResult.rows.length === 0) {
                throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 });
            }

            if (productoResult.rows[0].estado !== 'disponible') {
                throw Object.assign(
                    new Error(`Producto "${productoResult.rows[0].nombre}" no está disponible (estado: ${productoResult.rows[0].estado})`),
                    { statusCode: 400 }
                );
            }

            // Generar código
            const codigo = await getNext('SUB', 'subastas');

            // Crear subasta
            const subastaResult = await client.query(
                `INSERT INTO subastas (usuario_id, codigo, producto_id, precio_inicial, incremento_minimo, estado, fecha_inicio)
         VALUES ($1, $2, $3, $4, $5, 'activa', NOW())
         RETURNING *`,
                [usuario_id, codigo, producto_id, precio_inicial, incremento_minimo]
            );

            // Cambiar estado del producto a 'en_subasta'
            await client.query(
                "UPDATE productos SET estado = 'en_subasta', updated_at = NOW() WHERE id = $1",
                [producto_id]
            );

            await client.query('COMMIT');
            return subastaResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Cerrar una subasta.
     * 
     * Lógica:
     * 1. Actualizar subasta (precio_final, ganadora_nombre, estado)
     * 2. Calcular ganancia = precio_final - producto.costo_base
     * 3. Crear venta automática tipo 'subasta'
     * 4. Crear venta_item
     * 5. Cambiar producto.estado = 'vendido'
     * 6. Si es ropa, actualizar lote.recuperado
     */
    async cerrar(id, data) {
        const { precio_final, ganadora_nombre, usuario_id } = data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Obtener la subasta
            const subastaResult = await client.query(
                'SELECT s.*, p.costo_base, p.categoria, p.lote_id FROM subastas s JOIN productos p ON s.producto_id = p.id WHERE s.id = $1 AND s.usuario_id = $2 FOR UPDATE',
                [id, usuario_id]
            );

            if (subastaResult.rows.length === 0) {
                throw Object.assign(new Error('Subasta no encontrada'), { statusCode: 404 });
            }

            const subasta = subastaResult.rows[0];

            if (subasta.estado !== 'activa') {
                throw Object.assign(new Error('La subasta no está activa'), { statusCode: 400 });
            }

            // 2. Calcular ganancia
            const costoBase = parseFloat(subasta.costo_base);
            const precioFinal = parseFloat(precio_final);
            const ganancia = precioFinal - costoBase;

            // 1. Actualizar subasta
            await client.query(
                `UPDATE subastas SET precio_final = $1, ganadora_nombre = $2, ganancia = $3, estado = 'finalizada', fecha_cierre = NOW()
         WHERE id = $4`,
                [precioFinal, ganadora_nombre, ganancia, id]
            );

            // 3. Crear venta automática tipo 'subasta'
            const codigoVenta = await getNext('V', 'ventas');
            const ventaResult = await client.query(
                `INSERT INTO ventas (usuario_id, codigo, tipo, total_venta, ganancia_total, fecha, cliente_nombre)
         VALUES ($1, $2, 'subasta', $3, $4, NOW(), $5)
         RETURNING *`,
                [usuario_id, codigoVenta, precioFinal, ganancia, ganadora_nombre]
            );

            const venta = ventaResult.rows[0];

            // 4. Crear venta_item
            await client.query(
                `INSERT INTO venta_items (venta_id, producto_id, precio_venta, costo_base, ganancia)
         VALUES ($1, $2, $3, $4, $5)`,
                [venta.id, subasta.producto_id, precioFinal, costoBase, ganancia]
            );

            // Vincular venta a la subasta
            await client.query(
                'UPDATE subastas SET venta_id = $1 WHERE id = $2',
                [venta.id, id]
            );

            // 5. Cambiar producto estado = 'vendido'
            await client.query(
                "UPDATE productos SET estado = 'vendido', updated_at = NOW() WHERE id = $1",
                [subasta.producto_id]
            );

            // 6. Si es ropa, actualizar lote.recuperado
            if (subasta.categoria === 'ropa' && subasta.lote_id) {
                await client.query(
                    'UPDATE lotes SET recuperado = COALESCE(recuperado, 0) + $1, updated_at = NOW() WHERE id = $2',
                    [precioFinal, subasta.lote_id]
                );
            }

            await client.query('COMMIT');

            // Retornar subasta actualizada
            const updatedSubasta = await pool.query(
                `SELECT s.*, p.nombre as producto_nombre, p.codigo as producto_codigo
         FROM subastas s JOIN productos p ON s.producto_id = p.id
         WHERE s.id = $1`,
                [id]
            );

            return updatedSubasta.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = subastasService;
