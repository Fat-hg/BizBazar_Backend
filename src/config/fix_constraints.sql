-- =============================================================
-- FIX: Eliminar constraint ropa_requiere_lote y remplazarlo
--      por uno que SOLO exige lote a la ropa, y permite que
--      la joyería también lo tenga opcionalmente.
-- Ejecutar en la BD de PRODUCCIÓN (AWS RDS / PostgreSQL EC2)
-- =============================================================

ALTER TABLE productos
    DROP CONSTRAINT IF EXISTS ropa_requiere_lote;

ALTER TABLE productos
    ADD CONSTRAINT ropa_requiere_lote CHECK (
        (categoria = 'ropa' AND lote_id IS NOT NULL) OR
        (categoria != 'ropa')
    );

-- Verificación
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'productos'::regclass
  AND conname = 'ropa_requiere_lote';
