

/**
 * Genera códigos secuenciales basados en un prefijo y la tabla correspondiente.
 * Ejemplo: generateCode('V', 'ventas') → 'V001', 'V002', etc.
 * Ejemplo: generateCode('LOT', 'lotes') → 'LOT001', 'LOT002', etc.
 * Ejemplo: generateCode('SUB', 'subastas') → 'SUB001', 'SUB002', etc.
 */
const db = require('../config/db');

const getNext = async (prefijo, tabla) => {
    const res = await db.query(`SELECT COUNT(*) FROM ${tabla}`);
    const count = parseInt(res.rows[0].count) + 1;
    return `${prefijo}${count.toString().padStart(3, '0')}`;
};

module.exports = { getNext };