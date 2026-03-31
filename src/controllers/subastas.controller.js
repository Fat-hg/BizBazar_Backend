const subastasService = require('../services/subastas.service');

const subastasController = {
    async getAll(req, res, next) {
        try {
            const { estado } = req.query;
            const subastas = await subastasService.getAll(estado, req.user.id);
            res.json({ success: true, data: subastas });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const { producto_id, precio_inicial, incremento_minimo } = req.body;

            if (!producto_id || precio_inicial === undefined || incremento_minimo === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos requeridos: producto_id, precio_inicial, incremento_minimo',
                });
            }

            const subasta = await subastasService.create({ ...req.body, usuario_id: req.user.id });
            res.status(201).json({ success: true, data: subasta });
        } catch (error) {
            next(error);
        }
    },

    async cerrar(req, res, next) {
        try {
            const { precio_final, ganadora_nombre } = req.body;

            if (precio_final === undefined || !ganadora_nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos requeridos: precio_final, ganadora_nombre',
                });
            }

            const subasta = await subastasService.cerrar(req.params.id, { ...req.body, usuario_id: req.user.id });
            res.json({ success: true, data: subasta });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = subastasController;
