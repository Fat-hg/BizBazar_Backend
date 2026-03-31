const configuracionService = require('../services/configuracion.service');

const configuracionController = {
    async getNegocio(req, res, next) {
        try {
            const negocio = await configuracionService.getNegocio(req.user.id);
            res.json({ success: true, data: negocio });
        } catch (error) {
            next(error);
        }
    },

    async updateNegocio(req, res, next) {
        try {
            const negocio = await configuracionService.updateNegocio(req.body, req.user.id);
            res.json({ success: true, data: negocio });
        } catch (error) {
            next(error);
        }
    },

    async getCategorias(req, res, next) {
        try {
            const tipo = req.query.tipo;
            const categorias = await configuracionService.getCategorias(tipo, req.user.id);
            res.json({ success: true, data: categorias });
        } catch (error) {
            next(error);
        }
    },

    async createCategoria(req, res, next) {
        try {
            const categoria = await configuracionService.createCategoria(req.body, req.user.id);
            res.status(201).json({ success: true, data: categoria });
        } catch (error) {
            next(error);
        }
    },

    async deleteCategoria(req, res, next) {
        try {
            await configuracionService.deleteCategoria(req.params.id, req.user.id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    },

    async getAjustes(req, res, next) {
        try {
            const negocio = await configuracionService.getNegocio(req.user.id);
            res.json({
                success: true,
                data: {
                    incrementoMinimo: negocio.incremento_minimo_subasta,
                    moneda: negocio.moneda,
                    formatoCodigos: negocio.formato_codigo
                }
            });
        } catch (error) {
            next(error);
        }
    },

    async updateAjustes(req, res, next) {
        try {
            const updates = {
                incremento_minimo_subasta: req.body.incrementoMinimo,
                moneda: req.body.moneda,
                formato_codigo: req.body.formatoCodigos
            };
            const negocio = await configuracionService.updateNegocio(updates, req.user.id);
            res.json({
                success: true,
                data: {
                    incrementoMinimo: negocio.incremento_minimo_subasta,
                    moneda: negocio.moneda,
                    formatoCodigos: negocio.formato_codigo
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = configuracionController;
