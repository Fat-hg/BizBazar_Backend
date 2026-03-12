const authService = require('../services/auth.service');

const authController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y password son requeridos',
                });
            }

            const { usuario, token } = await authService.login(email, password);

            res.json({
                success: true,
                usuario,
                token
            });
        } catch (error) {
            next(error);
        }
    },

    async register(req, res, next) {
        try {
            const { nombre, email, password } = req.body;

            if (!nombre || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre, email y password son requeridos',
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 8 caracteres',
                });
            }

            const { usuario, token } = await authService.register(nombre, email, password);

            res.status(201).json({
                success: true,
                usuario,
                token
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = authController;
