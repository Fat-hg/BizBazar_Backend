const express = require('express');
const corsMiddleware = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const lotesRoutes = require('./routes/lotes.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const subastasRoutes = require('./routes/subastas.routes');
const reportesRoutes = require('./routes/reportes.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Middlewares globales
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log de peticiones
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'BizBazar API funcionando correctamente', timestamp: new Date().toISOString() });
});

const authMiddleware = require('./middlewares/auth.middleware');

// Montar rutas
app.use('/api/auth', authRoutes); // Rutas públicas (login)

// Rutas protegidas
app.use('/api/lotes', authMiddleware, lotesRoutes);
app.use('/api/productos', authMiddleware, productosRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/subastas', authMiddleware, subastasRoutes);
app.use('/api/reportes', authMiddleware, reportesRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Ruta para uploads (mock de Cloudinary)
app.post('/api/uploads', (req, res) => {
    const cloudinaryService = require('./services/cloudinary.service');
    const result = cloudinaryService.mockUpload(req.body);
    res.status(201).json({ success: true, data: result });
});

// Ruta base /api
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenido a la API de BizBazar',
        version: '1.0.0',
        endpoints: [
            '/api/health',
            '/api/auth/login',
            '/api/lotes',
            '/api/productos',
            '/api/ventas',
            '/api/subastas',
            '/api/dashboard',
            '/api/reportes/inventario',
        ]
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Ruta ${req.originalUrl} no encontrada` });
});

// Middleware de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
