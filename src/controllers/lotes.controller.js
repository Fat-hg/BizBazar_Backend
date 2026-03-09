const lotesService = require('../services/lotes.service');

const lotesController = {
    async getAll(req, res, next) {
        try {
            const { estado } = req.query;
            const lotes = await lotesService.getAll(estado);
            res.json({ success: true, data: lotes });
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const lote = await lotesService.getById(req.params.id);
            res.json({ success: true, data: lote });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const { codigo, nombre, fecha_compra, precio_total, gastos_adicionales, piezas_total } = req.body;

            if (!codigo || !nombre || !fecha_compra || !precio_total || !piezas_total) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos requeridos: codigo, nombre, fecha_compra, precio_total, piezas_total',
                });
            }

            const lote = await lotesService.create(req.body);
            res.status(201).json({ success: true, data: lote });
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const lote = await lotesService.update(req.params.id, req.body);
            res.json({ success: true, data: lote });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = lotesController;
