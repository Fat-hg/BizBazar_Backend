const router = require('express').Router();
const subastasController = require('../controllers/subastas.controller');

router.get('/', subastasController.getAll);
router.post('/', subastasController.create);
router.put('/:id/cerrar', subastasController.cerrar);

module.exports = router;
