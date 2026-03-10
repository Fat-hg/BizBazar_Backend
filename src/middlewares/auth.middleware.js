const { verifyToken } = require('../utils/jwt.utils');

/**
 * Middleware para proteger rutas usando JSON Web Tokens (JWT).
 * Extrae el token del header Authorization, lo verifica y adjunta 
 * la información del usuario en req.user para uso posterior.
 */
const authMiddleware = (req, res, next) => {
    // 1. Obtener el token del header. Formato esperado: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No se proporcionó un token de autenticación válido. Formato esperado: Bearer <token>'
        });
    }

    // 2. Extraer solo el string del token
    const token = authHeader.split(' ')[1];

    // 3. Verificar el token usando nuestra utilidad
    const decodedPayload = verifyToken(token);

    if (!decodedPayload) {
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.'
        });
    }

    // 4. Adjuntar los datos del usuario al objeto req
    req.user = decodedPayload;

    // 5. Dejar que la petición continúe hacia el controlador
    next();
};

module.exports = authMiddleware;
