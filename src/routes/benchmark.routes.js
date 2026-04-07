const express = require('express');
const router = express.Router();
const benchmarkService = require('../services/benchmark.service');
const googleAuthService = require('../services/googleAuth.service');

// Ruta para iniciar el flujo de OAuth de Google
router.get('/auth/google', (req, res) => {
    const url = googleAuthService.getAuthUrl();
    res.redirect(url);
});

// Callback de Google OAuth
router.get('/auth/google/callback', async (req, res, next) => {
    try {
        const { code } = req.query;
        const tokens = await googleAuthService.getTokens(code);
        // Guardar tokens en la sesión o enviarlos al frontend
        // Por ahora los devolvemos como JSON para pruebas
        res.json({ success: true, tokens });
    } catch (error) {
        next(error);
    }
});

// Generar snapshot y enviar a BigQuery
// Se espera el token de Google en el body o headers
router.post('/snapshot', async (req, res, next) => {
    try {
        const { google_token } = req.body;
        
        if (!google_token) {
            return res.status(400).json({ success: false, error: 'Se requiere el token de acceso de Google' });
        }

        // 1. Obtener métricas
        const metrics = await benchmarkService.getMetrics();
        
        // 2. Enviar a BigQuery
        await benchmarkService.sendToBigQuery(metrics, google_token);
        
        // 3. Reiniciar estadísticas
        await benchmarkService.resetStats();

        res.json({ success: true, message: 'Snapshot enviado y estadísticas reiniciadas' });
    } catch (error) {
        next(error);
    }
});

// Verificar estado de pg_stat_statements
router.get('/status', async (req, res, next) => {
    try {
        await benchmarkService.enableExtension();
        const metrics = await benchmarkService.getMetrics();
        res.json({ success: true, stats_active: true, current_queries: metrics.length });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
