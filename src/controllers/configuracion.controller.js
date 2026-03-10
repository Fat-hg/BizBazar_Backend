const configuracionService = require('../services/configuracion.service');

const configuracionController = {
    async getNegocio(req, res, next) {
        try {
            const negocio = await configuracionService.getNegocio();
            res.json({ success: true, data: negocio });
        } catch (error) {
            next(error);
        }
    },

    async updateNegocio(req, res, next) {
        try {
            const negocio = await configuracionService.updateNegocio(req.body);
            res.json({ success: true, data: negocio });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = configuracionController;
