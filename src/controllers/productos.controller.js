const productosService = require('../services/productos.service');

const productosController = {
    async getAll(req, res, next) {
        try {
            const { categoria, estado, search } = req.query;
            const productos = await productosService.getAll({ categoria, estado, search }, req.user.id);
            res.json({ success: true, data: productos });
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const producto = await productosService.getById(req.params.id, req.user.id);
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

            const producto = await productosService.create({ ...req.body, usuario_id: req.user.id });
            res.status(201).json({ success: true, data: producto });
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const producto = await productosService.update(req.params.id, req.body, req.user.id);
            res.json({ success: true, data: producto });
        } catch (error) {
            next(error);
        }
    },

    async delete(req, res, next) {
        try {
            await productosService.delete(req.params.id, req.user.id);
            res.json({ success: true, message: 'Producto eliminado exitosamente' });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = productosController;
