const storageService = require('../services/storageService');
const contentService = require('../services/contentService');
const { sendError } = require('../utils/appError');
const { resolveUserId } = require('../utils/resolveUserId');

const ContentController = {
    createContent: async (req, res) => {
        try {
            const content = await contentService.createContent(req.body);
            res.status(201).json({ status: 'success', data: content, warnings: content.warnings });
        } catch (error) {
            return sendError(res, error);
        }
    },

    updateContent: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await contentService.updateContent(id, req.body);
            res.status(200).json({ status: 'success', data: content, warnings: content.warnings });
        } catch (error) {
            return sendError(res, error);
        }
    },

    deleteContent: async (req, res) => {
        try {
            const { id } = req.params;
            await contentService.deleteContent(id);
            return res.status(204).json({ status: 'success', message: 'Content deleted successfully' });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getUploadUrl: async (req, res) => {
        try {
            const payload = await storageService.getUploadUrl(req.body);
            return res.status(200).json({ status: 'success', data: payload });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getAllContent: async (req, res) => {
        try {
            const safePage = Math.max(1, Number(req.query.page) || 1);
            const safeLimit = Math.max(1, Number(req.query.limit) || 10);
            const lessonId = req.query.lessonId;
            const result = await contentService.getAllContent({ lessonId, page: safePage, limit: safeLimit });
            return res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getContentById: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await contentService.getContentById(id);
            return res.status(200).json({ status: 'success', data: content });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getOfflineData: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await contentService.getOfflineData(id);
            return res.status(200).json({ status: 'success', data: data });
        } catch (error) {
            return sendError(res, error);
        }
    },

    finalizeUpload: async (req, res) => {
        try {
            const content = await contentService.finalizeContentUpload(req.body);
            return res.status(201).json({ status: 'success', data: content });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getQuizOverview: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const data = await contentService.getQuizOverview(id, userId);
            return res.status(200).json({ status: 'success', data });
        } catch (error) {
            return sendError(res, error);
        }
    },

    submitQuiz: async (req, res) => {
        try {
            const { id } = req.params;
            const answers = req.body.answers;
            const timeTaken = req.body.timeTaken || 0;
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const result = await contentService.submitQuiz(id, userId, answers, timeTaken);
            return res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            return sendError(res, error);
        }
    },

};

module.exports = ContentController;
