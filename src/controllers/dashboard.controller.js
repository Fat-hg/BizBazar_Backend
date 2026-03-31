const dashboardService = require('../services/dashboard.service');

const dashboardController = {
    async getMetrics(req, res, next) {
        try {
            const data = await dashboardService.getMetrics(req.user.id);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = dashboardController;
