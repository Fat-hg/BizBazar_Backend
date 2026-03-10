const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracion.controller');

router.get('/negocio', configuracionController.getNegocio);
router.put('/negocio', configuracionController.updateNegocio);

module.exports = router;
