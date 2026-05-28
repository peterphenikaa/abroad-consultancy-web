const moduleService = require('../services/moduleService');
const { sendError } = require('../utils/appError');

const ModuleController = {
    createModule: async (req, res) => {
        try {
            const module = await moduleService.createModule(req.body);
            return res.status(201).json(module);
        } catch (error) {
            return sendError(res, error);
        }
    },

    updateModule: async (req, res) => {
        try {
            const { id } = req.params;
            const module = await moduleService.updateModule(id, req.body);
            return res.status(200).json(module);
        } catch (error) {
            return sendError(res, error);
        }
    },

    deleteModule: async (req, res) => {
        try {
            const { id } = req.params;
            await moduleService.deleteModule(id);
            return res.status(204).send();
        } catch (error) {
            return sendError(res, error);
        }
    },

    publishModule: async (req, res) => {
        try {
            const { id } = req.params;
            const module = await moduleService.publishModule(id);
            return res.status(200).json(module);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getAllModule: async (req, res) => {
        try {
            const safePage = Math.max(1, Number(req.query.page) || 1);
            const safeLimit = Math.max(1, Number(req.query.limit) || 10);
            const courseId = req.query.courseId;
            const result = await moduleService.getAllModule({ courseId, page: safePage, limit: safeLimit });
            return res.status(200).json(result);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getModuleById: async (req, res) => {
        try {
            const { id } = req.params;
            const module = await moduleService.getModuleById(id);
            return res.status(200).json(module);
        } catch (error) {
            return sendError(res, error);
        }
    }
};

module.exports = ModuleController;