const pool = require('../config/db');
const googleAuthService = require('./googleAuth.service');
const logger = require('../utils/logger');

class BenchmarkService {
    /**
     * Habilita la extensión pg_stat_statements si no está activa
     */
    async enableExtension() {
        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;');
            logger.info('Extensión pg_stat_statements verificada/habilitada.');
        } catch (error) {
            logger.error('Error al habilitar pg_stat_statements:', error);
            throw new Error('No se pudo activar la extensión de métricas.');
        }
    }

    /**
     * Obtiene las métricas actuales de pg_stat_statements
     */
    async getMetrics() {
        const query = `
            SELECT 
                query,
                calls,
                total_exec_time,
                min_exec_time,
                max_exec_time,
                mean_exec_time,
                rows,
                shared_blks_hit,
                shared_blks_read,
                shared_blks_dirtied,
                shared_blks_written,
                local_blks_hit,
                local_blks_read,
                blk_read_time,
                blk_write_time
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat_statements%'
            ORDER BY total_exec_time DESC
            LIMIT 50;
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Serializa las métricas a JSON y las envía a BigQuery
     * @param {string} googleToken - Token de acceso de Google OAuth
     */
    async sendToBigQuery(metrics, googleToken) {
        try {
            const bigquery = googleAuthService.getBigQueryClient();
            
            // Configurar el token para el cliente
            googleAuthService.setCredentials({ access_token: googleToken });

            const projectId = process.env.GOOGLE_PROJECT_ID;
            const datasetId = process.env.BIGQUERY_DATASET_ID || 'almacen_central';
            const tableId = process.env.BIGQUERY_TABLE_ID || 'benchmarking_metrics';

            // Preparar filas para BigQuery
            const rows = metrics.map(m => ({
                project_id: process.env.TEAM_PROJECT_ID || 'equipo_bizbazar',
                snapshot_date: new Date().toISOString(),
                query: m.query,
                num_calls: m.calls,
                total_time: m.total_exec_time,
                mean_time: m.mean_exec_time,
                rows_processed: m.rows,
                buffer_hits: m.shared_blks_hit,
                buffer_reads: m.shared_blks_read,
                warehouse_id: process.env.WAREHOUSE_ID || '7' // El número de almacén asignado
            }));

            // Inserción en BigQuery
            const response = await bigquery.tabledata.insertAll({
                projectId,
                datasetId,
                tableId,
                requestBody: {
                    rows: rows.map(row => ({ json: row }))
                }
            });

            logger.info('Métricas enviadas exitosamente a BigQuery');
            return response.data;
        } catch (error) {
            logger.error('Error al enviar a BigQuery:', error);
            throw error;
        }
    }

    /**
     * Reinicia las estadísticas después de un envío exitoso
     */
    async resetStats() {
        await pool.query('SELECT pg_stat_statements_reset();');
        logger.info('Estadísticas de pg_stat_statements reiniciadas.');
    }
}

module.exports = new BenchmarkService();
