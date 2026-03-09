const pool = require('../config/db');
const { getNext } = require('../utils/generateCode');

const ventasService = {
    /**
     * Listar todas las ventas con sus items.
     */
    async getAll() {
        const ventasResult = await pool.query(`
      SELECT v.*,
             json_agg(
               json_build_object(
                 'id', vi.id,
                 'producto_id', vi.producto_id,
                 'precio_venta', vi.precio_venta,
                 'costo_base', vi.costo_base,
                 'ganancia', vi.ganancia,
                 'producto_nombre', p.nombre,
                 'producto_codigo', p.codigo
               )
             ) as items
      FROM ventas v
      LEFT JOIN venta_items vi ON v.id = vi.venta_id
      LEFT JOIN productos p ON vi.producto_id = p.id
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `);

        return ventasResult.rows;
    },

    /**
     * Obtener detalle de una venta por ID con todos sus items.
     */
    async getById(id) {
        const ventaResult = await pool.query('SELECT * FROM ventas WHERE id = $1', [id]);

        if (ventaResult.rows.length === 0) {
            const error = new Error('Venta no encontrada');
            error.statusCode = 404;
            throw error;
        }

        const itemsResult = await pool.query(
            `SELECT vi.*, p.nombre as producto_nombre, p.codigo as producto_codigo, p.categoria as producto_categoria
       FROM venta_items vi
       JOIN productos p ON vi.producto_id = p.id
       WHERE vi.venta_id = $1`,
            [id]
        );

        return {
            ...ventaResult.rows[0],
            items: itemsResult.rows,
        };
    },

    /**
     * Crear una venta completa con transacción.
     * 
     * Lógica:
     * 1. Iniciar transacción
     * 2. Para cada item: validar producto disponible, obtener costo_base, calcular ganancia
     * 3. Generar código de venta (V001, V002...)
     * 4. Crear registro en ventas
     * 5. Crear registros en venta_items
     * 6. Actualizar productos.estado = 'vendido'
     * 7. Si producto.categoria='ropa': actualizar lotes.recuperado
     * 8. Commit transacción
     */
    async create(data) {
        const { items, cliente_nombre } = data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let totalVenta = 0;
            let gananciaTotal = 0;
            const processedItems = [];

            // 2. Procesar cada item
            for (const item of items) {
                // 2a. Validar que producto existe y estado='disponible'
                const productoResult = await client.query(
                    'SELECT id, codigo, nombre, costo_base, estado, categoria, lote_id FROM productos WHERE id = $1 FOR UPDATE',
                    [item.producto_id]
                );

                if (productoResult.rows.length === 0) {
                    throw Object.assign(new Error(`Producto ${item.producto_id} no encontrado`), { statusCode: 404 });
                }

                const producto = productoResult.rows[0];

                if (producto.estado !== 'disponible') {
                    throw Object.assign(new Error(`Producto "${producto.nombre}" no está disponible (estado: ${producto.estado})`), { statusCode: 400 });
                }

                // 2b. Obtener costo_base
                const costoBase = parseFloat(producto.costo_base);
                const precioVenta = parseFloat(item.precio_venta);

                // 2c. Calcular ganancia
                const ganancia = precioVenta - costoBase;

                totalVenta += precioVenta;
                gananciaTotal += ganancia;

                processedItems.push({
                    producto_id: producto.id,
                    precio_venta: precioVenta,
                    costo_base: costoBase,
                    ganancia,
                    categoria: producto.categoria,
                    lote_id: producto.lote_id,
                });
            }

            // 3. Generar código de venta
            const codigo = await getNext('V', 'ventas');

            // 4. Crear registro en tabla ventas
            const ventaResult = await client.query(
                `INSERT INTO ventas (codigo, tipo, total_venta, ganancia_total, fecha, cliente_nombre)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         RETURNING *`,
                [codigo, 'directa', totalVenta, gananciaTotal, cliente_nombre || null]
            );

            const venta = ventaResult.rows[0];

            // 5. Crear registros en venta_items y 6. Actualizar estado de productos
            const ventaItems = [];
            for (const processedItem of processedItems) {
                // 5. Crear venta_item
                const itemResult = await client.query(
                    `INSERT INTO venta_items (venta_id, producto_id, precio_venta, costo_base, ganancia)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
                    [venta.id, processedItem.producto_id, processedItem.precio_venta, processedItem.costo_base, processedItem.ganancia]
                );
                ventaItems.push(itemResult.rows[0]);

                // 6. Actualizar producto estado = 'vendido'
                await client.query(
                    "UPDATE productos SET estado = 'vendido', updated_at = NOW() WHERE id = $1",
                    [processedItem.producto_id]
                );

                // 7. Si producto es ropa, actualizar lotes.recuperado
                if (processedItem.categoria === 'ropa' && processedItem.lote_id) {
                    await client.query(
                        `UPDATE lotes SET recuperado = COALESCE(recuperado, 0) + $1, updated_at = NOW() WHERE id = $2`,
                        [processedItem.precio_venta, processedItem.lote_id]
                    );
                }
            }

            // 8. Commit
            await client.query('COMMIT');

            return {
                ...venta,
                items: ventaItems,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = ventasService;
