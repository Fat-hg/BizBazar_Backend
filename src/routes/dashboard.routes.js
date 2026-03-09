const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/', dashboardController.getMetrics);

module.exports = router;
