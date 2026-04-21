const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000,  // 10s para obtener conexión
    idleTimeoutMillis: 30000,        // 30s antes de cerrar conexión idle
    query_timeout: 15000,            // 15s timeout por query
    max: 20,                         // máximo de conexiones en el pool
});

pool.on('connect', () => {
    logger.info('Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    logger.error('Error inesperado en PostgreSQL:', err);
    process.exit(-1);
});

module.exports = pool;
