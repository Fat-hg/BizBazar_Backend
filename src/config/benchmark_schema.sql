-- ============================================
-- TABLAS DE BENCHMARKING (SEGÚN GUÍA OFICIAL)
-- ============================================

-- 1. PROJECTS (Contexto experimental)
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_type VARCHAR(20) NOT NULL CHECK (
        project_type IN ('ECOMMERCE', 'SOCIAL', 'FINANCIAL', 'HEALTHCARE', 'IOT',
                         'EDUCATION', 'CONTENT', 'ENTERPRISE', 'LOGISTICS', 'GOVERNMENT')
    ),
    description TEXT,
    db_engine VARCHAR(20) NOT NULL CHECK (
        db_engine IN ('POSTGRESQL', 'MYSQL', 'MONGODB', 'OTHER')
    )
);

-- 2. QUERIES (Catálogo de consultas)
CREATE TABLE IF NOT EXISTS queries (
    query_id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(project_id),
    query_description TEXT NOT NULL,
    query_sql TEXT NOT NULL,
    target_table VARCHAR(100),
    query_type VARCHAR(30) CHECK (
        query_type IN ('SIMPLE_SELECT', 'AGGREGATION', 'JOIN', 
                       'WINDOW_FUNCTION', 'SUBQUERY', 'WRITE_OPERATION')
    )
);

-- 3. EXECUTIONS (Métricas por ejecución)
CREATE TABLE IF NOT EXISTS executions (
    execution_id BIGSERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(project_id),
    query_id INT REFERENCES queries(query_id),
    index_strategy VARCHAR(20) CHECK (
        index_strategy IN ('NO_INDEX', 'SINGLE_INDEX', 'COMPOSITE_INDEX')
    ),
    execution_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms BIGINT,
    records_examined BIGINT,
    records_returned BIGINT,
    dataset_size_rows BIGINT,
    dataset_size_mb NUMERIC,
    concurrent_sessions INT,
    shared_buffers_hits BIGINT,
    shared_buffers_reads BIGINT
);

-- Habilitar extensión pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Insertar proyecto por defecto
INSERT INTO projects (project_type, description, db_engine) 
SELECT 'ECOMMERCE', 'BizBazar - Sistema de gestión de inventario y ventas', 'POSTGRESQL'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_id = 1);

-- Insertar queries de ejemplo
INSERT INTO queries (project_id, query_description, query_sql, target_table, query_type)
SELECT 1, 'Dashboard - Métricas principales', 'SELECT COUNT(*) FROM productos WHERE estado = ''disponible''', 'productos', 'SIMPLE_SELECT'
WHERE NOT EXISTS (SELECT 1 FROM queries WHERE query_id = 1);


CREATE OR REPLACE VIEW v_daily_export AS
SELECT
    1 AS project_id,
    CURRENT_DATE AS snapshot_date,
    pss.queryid::TEXT,
    pss.dbid,
    pss.userid,
    pss.query,
    pss.calls,
    ROUND((pss.total_exec_time)::NUMERIC, 2) AS total_exec_time_ms,
    ROUND((pss.mean_exec_time)::NUMERIC, 2) AS mean_exec_time_ms,
    ROUND((pss.min_exec_time)::NUMERIC, 2) AS min_exec_time_ms,
    ROUND((pss.max_exec_time)::NUMERIC, 2) AS max_exec_time_ms,
    ROUND((pss.stddev_exec_time)::NUMERIC, 2) AS stddev_exec_time_ms,
    pss.rows,
    pss.shared_blks_hit,
    pss.shared_blks_read,
    pss.shared_blks_dirtied,
    pss.shared_blks_written,
    pss.temp_blks_read,
    pss.temp_blks_written
FROM pg_stat_statements pss
WHERE pss.query NOT LIKE '%pg_stat_statements%'
  AND pss.calls > 0;
