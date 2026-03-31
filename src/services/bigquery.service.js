const { BigQuery } = require('@google-cloud/bigquery');
const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Servicio para enviar métricas a BigQuery usando OAuth
 */
const sendToBigQuery = async (accessToken) => {
    try {
        // 1. Obtener métricas de la vista
        const metricsResult = await pool.query('SELECT * FROM v_daily_export');
        
        if (metricsResult.rows.length === 0) {
            return { success: false, message: 'No hay métricas para enviar (ejecuta algunas consultas primero)' };
        }
        
        // 2. Transformar datos al formato de BigQuery
        const rows = metricsResult.rows.map(row => ({
            project_id: parseInt(row.project_id),
            snapshot_date: row.snapshot_date,
            queryid: row.queryid,
            dbid: parseInt(row.dbid),
            userid: parseInt(row.userid),
            query: row.query,
            calls: parseInt(row.calls),
            total_exec_time_ms: parseFloat(row.total_exec_time_ms),
            mean_exec_time_ms: parseFloat(row.mean_exec_time_ms),
            min_exec_time_ms: parseFloat(row.min_exec_time_ms),
            max_exec_time_ms: parseFloat(row.max_exec_time_ms),
            stddev_exec_time_ms: parseFloat(row.stddev_exec_time_ms),
            rows_returned: parseInt(row.rows),
            shared_blks_hit: parseInt(row.shared_blks_hit),
            shared_blks_read: parseInt(row.shared_blks_read),
            shared_blks_dirtied: parseInt(row.shared_blks_dirtied),
            shared_blks_written: parseInt(row.shared_blks_written),
            temp_blks_read: parseInt(row.temp_blks_read),
            temp_blks_written: parseInt(row.temp_blks_written)
        }));
        
        // 3. Inicializar cliente BigQuery con OAuth token
        const bigquery = new BigQuery({
            projectId: process.env.BIGQUERY_PROJECT_ID,
            credentials: {
                type: 'authorized_user',
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: accessToken // En el flujo OAuth de Google, se puede usar el access_token directamente si es temporal
            }
        });

        // Nota: Si el token enviado es un ACCESS_TOKEN directo, 
        // a veces la librería prefiere configurarlo así:
        // bigquery.authClient.setCredentials({ access_token: accessToken });
        
        // 4. Insertar en BigQuery
        const datasetId = process.env.BIGQUERY_DATASET;
        const tableId = process.env.BIGQUERY_TABLE;
        
        logger.info(`Iniciando inserción de ${rows.length} filas en BigQuery: ${datasetId}.${tableId}`);

        const [errors] = await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert(rows);
        
        if (errors && errors.length > 0) {
            logger.error('Errores al insertar en BigQuery:', JSON.stringify(errors));
            return { success: false, errors };
        }
        
        // 5. Reset de estadísticas SOLO si el envío fue exitoso
        await pool.query('SELECT pg_stat_statements_reset()');
        logger.info('Métricas enviadas y pg_stat_statements reiniciado.');
        
        return {
            success: true,
            rowsSent: rows.length,
            message: 'Métricas enviadas correctamente a BigQuery'
        };
        
    } catch (error) {
        logger.error('Error en sendToBigQuery:', error);
        throw error;
    }
};

module.exports = { sendToBigQuery };
