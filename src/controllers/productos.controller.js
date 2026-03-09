const productosService = require('../services/productos.service');

const productosController = {
    async getAll(req, res, next) {
        try {
            const { categoria, estado, search } = req.query;
            const productos = await productosService.getAll({ categoria, estado, search });
            res.json({ success: true, data: productos });
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const producto = await productosService.getById(req.params.id);
            res.json({ success: true, data: producto });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const { codigo, nombre, categoria, tipo_venta, costo_base } = req.body;

            if (!codigo || !nombre || !categoria || !tipo_venta || costo_base === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos requeridos: codigo, nombre, categoria, tipo_venta, costo_base',
                });
            }

            const producto = await productosService.create(req.body);
            res.status(201).json({ success: true, data: producto });
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const producto = await productosService.update(req.params.id, req.body);
            res.json({ success: true, data: producto });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = productosController;
