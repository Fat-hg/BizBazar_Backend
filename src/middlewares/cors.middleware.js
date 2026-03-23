const cors = require('cors');

const corsMiddleware = cors({
    origin: function (origin, callback) {
        // Permitir localhost, tu dominio específico y cualquier subdominio de Vercel
        if (!origin || 
            origin.startsWith('http://localhost') || 
            origin.endsWith('.vercel.app') || 
            origin === 'https://api.bizbazar.lat') {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
});

module.exports = corsMiddleware;
