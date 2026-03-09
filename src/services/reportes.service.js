const pool = require('../config/db');

const reportesService = {
    /**
     * Reporte diario para una fecha específica.
     */
    async getDiario(fecha) {
        const [ventasDia, gananciasDia, productosMasVendidos, ventasDetalle] = await Promise.all([
            // Total de ventas del día
            pool.query(
                "SELECT COUNT(*)::int as total_ventas, COALESCE(SUM(total_venta), 0)::numeric as total_ingresos, COALESCE(SUM(ganancia_total), 0)::numeric as total_ganancia FROM ventas WHERE fecha::date = $1",
                [fecha]
            ),

            // Ganancias por categoría
            pool.query(
                `SELECT p.categoria, 
                COUNT(*)::int as cantidad,
                COALESCE(SUM(vi.precio_venta), 0)::numeric as total_vendido,
                COALESCE(SUM(vi.ganancia), 0)::numeric as total_ganancia
         FROM venta_items vi
         JOIN productos p ON vi.producto_id = p.id
         JOIN ventas v ON vi.venta_id = v.id
         WHERE v.fecha::date = $1
         GROUP BY p.categoria`,
                [fecha]
            ),

            // Productos más vendidos del día
            pool.query(
                `SELECT p.nombre, p.codigo, vi.precio_venta, vi.ganancia
         FROM venta_items vi
         JOIN productos p ON vi.producto_id = p.id
         JOIN ventas v ON vi.venta_id = v.id
         WHERE v.fecha::date = $1
         ORDER BY vi.precio_venta DESC
         LIMIT 5`,
                [fecha]
            ),

            // Detalle de ventas del día
            pool.query(
                `SELECT v.*, 
                json_agg(
                  json_build_object(
                    'producto_nombre', p.nombre,
                    'precio_venta', vi.precio_venta,
                    'ganancia', vi.ganancia
                  )
                ) as items
         FROM ventas v
         LEFT JOIN venta_items vi ON v.id = vi.venta_id
         LEFT JOIN productos p ON vi.producto_id = p.id
         WHERE v.fecha::date = $1
         GROUP BY v.id
         ORDER BY v.created_at DESC`,
                [fecha]
            ),
        ]);

        return {
            fecha,
            resumen: {
                total_ventas: ventasDia.rows[0].total_ventas,
                total_ingresos: parseFloat(ventasDia.rows[0].total_ingresos),
                total_ganancia: parseFloat(ventasDia.rows[0].total_ganancia),
            },
            por_categoria: gananciasDia.rows,
            productos_top: productosMasVendidos.rows,
            ventas: ventasDetalle.rows,
        };
    },

    /**
     * Reporte de inventario actual.
     */
    async getInventario() {
        const [resumenGeneral, porCategoria, porEstado, lotesResumen] = await Promise.all([
            // Resumen general
            pool.query(`
        SELECT 
          COUNT(*)::int as total_productos,
          COUNT(*) FILTER (WHERE estado = 'disponible')::int as disponibles,
          COUNT(*) FILTER (WHERE estado = 'vendido')::int as vendidos,
          COUNT(*) FILTER (WHERE estado = 'en_subasta')::int as en_subasta,
          COALESCE(SUM(costo_base) FILTER (WHERE estado = 'disponible'), 0)::numeric as valor_inventario
        FROM productos
      `),

            // Por categoría
            pool.query(`
        SELECT categoria, 
               COUNT(*)::int as total,
               COUNT(*) FILTER (WHERE estado = 'disponible')::int as disponibles,
               COUNT(*) FILTER (WHERE estado = 'vendido')::int as vendidos,
               COALESCE(SUM(costo_base) FILTER (WHERE estado = 'disponible'), 0)::numeric as valor_disponible
        FROM productos
        GROUP BY categoria
      `),

            // Por estado
            pool.query(`
        SELECT estado, COUNT(*)::int as cantidad
        FROM productos
        GROUP BY estado
        ORDER BY cantidad DESC
      `),

            // Resumen de lotes
            pool.query(`
        SELECT l.*,
               COUNT(p.id)::int as total_productos,
               COUNT(p.id) FILTER (WHERE p.estado = 'disponible')::int as productos_disponibles,
               COUNT(p.id) FILTER (WHERE p.estado = 'vendido')::int as productos_vendidos
        FROM lotes l
        LEFT JOIN productos p ON l.id = p.lote_id
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `),
        ]);

        return {
            resumen: {
                total_productos: resumenGeneral.rows[0].total_productos,
                disponibles: resumenGeneral.rows[0].disponibles,
                vendidos: resumenGeneral.rows[0].vendidos,
                en_subasta: resumenGeneral.rows[0].en_subasta,
                valor_inventario: parseFloat(resumenGeneral.rows[0].valor_inventario),
            },
            por_categoria: porCategoria.rows.map(row => ({
                ...row,
                valor_disponible: parseFloat(row.valor_disponible),
            })),
            por_estado: porEstado.rows,
            lotes: lotesResumen.rows,
        };
    },
};

module.exports = reportesService;
