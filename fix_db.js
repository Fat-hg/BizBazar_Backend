const pool = require('./src/config/db');

async function run() {
    try {
        console.log("Iniciando migración de base de datos...");
        
        console.log("Asegurando que existe la tabla categorias...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log("Limpiando IDs inválidos en productos...");
        await pool.query('UPDATE productos SET subcategoria_id = NULL WHERE subcategoria_id NOT IN (SELECT id FROM categorias)');

        console.log("Eliminando constraint foránea vieja...");
        await pool.query('ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_subcategoria_id_fkey');

        console.log("Creando nueva constraint apuntando a categorias(id)...");
        await pool.query('ALTER TABLE productos ADD CONSTRAINT productos_subcategoria_id_fkey FOREIGN KEY (subcategoria_id) REFERENCES categorias(id) ON DELETE SET NULL');

        console.log("Vaciando tabla vieja subcategorias...");
        await pool.query('DROP TABLE IF EXISTS subcategorias CASCADE');

        console.log("¡Migración completada exitosamente!");
        process.exit(0);
    } catch (e) {
        console.error("Error durante migración:", e);
        process.exit(1);
    }
}

run();
