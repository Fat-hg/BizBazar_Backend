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

            const user = await authService.login(email, password);

            res.json({
                success: true,
                user,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = authController;
