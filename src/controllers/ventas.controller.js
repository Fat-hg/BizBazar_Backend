const ventasService = require('../services/ventas.service');

const ventasController = {
    async getAll(req, res, next) {
        try {
            const ventas = await ventasService.getAll();
            res.json({ success: true, data: ventas });
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const venta = await ventasService.getById(req.params.id);
            res.json({ success: true, data: venta });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de items con al menos un elemento',
                });
            }

            for (const item of items) {
                if (!item.producto_id || item.precio_venta === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'Cada item debe tener producto_id y precio_venta',
                    });
                }
            }

            const venta = await ventasService.create(req.body);
            res.status(201).json({ success: true, data: venta });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = ventasController;
