const express = require('express');
const router = express.Router();
const { sendToBigQuery } = require('../services/bigquery.service');
const googleAuthService = require('../services/googleAuth.service');

// Endpoint para iniciar sesión con Google y obtener el token (Útil para pruebas)
router.get('/auth/google', (req, res) => {
    const url = googleAuthService.getAuthUrl();
    res.redirect(url);
});

// Callback de Google para recibir el código y generar el token
router.get('/auth/google/callback', async (req, res, next) => {
    try {
        const { code } = req.query;
        const tokens = await googleAuthService.getTokens(code);
        res.json({ success: true, accessToken: tokens.access_token, tokens });
    } catch (error) {
        next(error);
    }
});

// Endpoint para enviar snapshot diario
router.post('/snapshot', async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere accessToken de Google OAuth'
            });
        }
        
        const result = await sendToBigQuery(accessToken);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
