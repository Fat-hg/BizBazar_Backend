const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracion.controller');

router.get('/negocio', configuracionController.getNegocio);
router.put('/negocio', configuracionController.updateNegocio);

router.get('/categorias', configuracionController.getCategorias);
router.post('/categorias', configuracionController.createCategoria);
router.delete('/categorias/:id', configuracionController.deleteCategoria);

router.get('/ajustes', configuracionController.getAjustes);
router.put('/ajustes', configuracionController.updateAjustes);

module.exports = router;
