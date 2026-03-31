const { google } = require('googleapis');
const logger = require('../utils/logger');

/**
 * Servicio para manejar la autenticación con Google OAuth 2.0
 * Requerido para enviar datos a BigQuery.
 */
class GoogleAuthService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Genera la URL para que el usuario inicie sesión con Google
     */
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/bigquery',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Intercambia el código de autorización por tokens
     */
    async getTokens(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            logger.error('Error al obtener tokens de Google:', error);
            throw new Error('No se pudo autenticar con Google');
        }
    }

    /**
     * Configura las credenciales para futuras peticiones
     */
    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }

    /**
     * Obtiene el cliente de BigQuery autenticado
     */
    getBigQueryClient() {
        return google.bigquery({ version: 'v2', auth: this.oauth2Client });
    }
}

module.exports = new GoogleAuthService();
