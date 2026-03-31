const pool = require('../config/db');

const dashboardService = {
  
    async getMetrics(usuario_id) {
        const [
            ropaDisponible,
            joyeriaDisponible,
            vendidosHoy,
            gananciaHoy,
            gananciaAcumulada,
            lotesActivos,
            ventasRecientes,
        ] = await Promise.all([
          
            pool.query("SELECT COUNT(*)::int as count FROM productos WHERE categoria = 'ropa' AND estado = 'disponible' AND usuario_id = $1", [usuario_id]),

            pool.query("SELECT COUNT(*)::int as count FROM productos WHERE categoria = 'joyeria' AND estado = 'disponible' AND usuario_id = $1", [usuario_id]),

            pool.query("SELECT COUNT(*)::int as count FROM venta_items vi JOIN ventas v ON vi.venta_id = v.id WHERE v.fecha::date = CURRENT_DATE AND v.usuario_id = $1", [usuario_id]),

            pool.query("SELECT COALESCE(SUM(ganancia_total), 0)::numeric as total FROM ventas WHERE fecha::date = CURRENT_DATE AND usuario_id = $1", [usuario_id]),

            pool.query("SELECT COALESCE(SUM(ganancia_total), 0)::numeric as total FROM ventas WHERE usuario_id = $1", [usuario_id]),

            pool.query("SELECT COUNT(*)::int as count FROM lotes WHERE estado = 'activo' AND usuario_id = $1", [usuario_id]),

            pool.query(`
        SELECT v.*,
               json_agg(
                 json_build_object(
                   'producto_nombre', p.nombre,
                   'producto_codigo', p.codigo,
                   'precio_venta', vi.precio_venta,
                   'ganancia', vi.ganancia
                 )
               ) as items
        FROM ventas v
        LEFT JOIN venta_items vi ON v.id = vi.venta_id
        LEFT JOIN productos p ON vi.producto_id = p.id
        WHERE v.usuario_id = $1
        GROUP BY v.id
        ORDER BY v.created_at DESC
        LIMIT 10
      `, [usuario_id]),
        ]);

        return {
            metricas: {
                productos_ropa_disponibles: ropaDisponible.rows[0].count,
                joyeria_disponible: joyeriaDisponible.rows[0].count,
                vendidos_hoy: vendidosHoy.rows[0].count,
                ganancia_dia: parseFloat(gananciaHoy.rows[0].total),
                ganancia_acumulada: parseFloat(gananciaAcumulada.rows[0].total),
                lotes_activos: lotesActivos.rows[0].count,
            },
            ventas_recientes: ventasRecientes.rows,
        };
    },
};

module.exports = dashboardService;
