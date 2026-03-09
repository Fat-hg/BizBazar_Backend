const router = require('express').Router();
const reportesController = require('../controllers/reportes.controller');

router.get('/diario', reportesController.getDiario);
router.get('/inventario', reportesController.getInventario);

module.exports = router;
