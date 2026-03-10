const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_bizbazar_key_2024';
const JWT_EXPIRES_IN = '24h';

const jwtUtils = {
    /**
     * Genera un token JWT para un usuario.
     * @param {Object} payload Datos a encriptar (ej. id de usuario).
     * @returns {string} Token JWT firmado.
     */
    generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    /**
     * Verifica la validez de un token JWT.
     * @param {string} token Token JWT a verificar.
     * @returns {Object} Payload desencriptado si es exitoso.
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null; // Token inválido o expirado
        }
    }
};

module.exports = jwtUtils;
