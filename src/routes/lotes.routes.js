const router = require('express').Router();
const lotesController = require('../controllers/lotes.controller');

router.get('/', lotesController.getAll);
router.get('/:id', lotesController.getById);
router.post('/', lotesController.create);
router.put('/:id', lotesController.update);

module.exports = router;
