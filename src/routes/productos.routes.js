const router = require('express').Router();
const productosController = require('../controllers/productos.controller');

router.get('/', productosController.getAll);
router.get('/:id', productosController.getById);
router.post('/', productosController.create);
router.put('/:id', productosController.update);

module.exports = router;
