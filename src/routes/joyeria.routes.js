const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Interceptar todas las peticiones a joyeria para forzar la categoría
router.use((req, res, next) => {
    req.query.categoria = 'joyeria'; // For GETs
    if (req.method === 'POST') {
        req.body.categoria = 'joyeria'; // For POSTs
    }
    next();
});

router.get('/', productosController.getAll);
router.post('/', productosController.create);
router.get('/:id', productosController.getById);
router.put('/:id', productosController.update);
router.delete('/:id', productosController.delete);

module.exports = router;
