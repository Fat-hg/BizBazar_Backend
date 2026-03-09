const reportesService = require('../services/reportes.service');

const reportesController = {
    async getDiario(req, res, next) {
        try {
            const { fecha } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere el parámetro fecha (formato: YYYY-MM-DD)',
                });
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(fecha)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de fecha inválido. Use YYYY-MM-DD',
                });
            }

            const reporte = await reportesService.getDiario(fecha);
            res.json({ success: true, data: reporte });
        } catch (error) {
            next(error);
        }
    },

    async getInventario(req, res, next) {
        try {
            const reporte = await reportesService.getInventario();
            res.json({ success: true, data: reporte });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = reportesController;
