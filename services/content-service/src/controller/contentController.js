const storageService = require('../services/storageService');
const contentService = require('../services/contentService');

function sendError(res, error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
}

const ContentController = {
    createContent: async (req, res) => {
        try {
            const content = await contentService.createContent(req.body);
            res.status(201).json(content);
        } catch (error) {
            return sendError(res, error);
        }
    },

    updateContent: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await contentService.updateContent(id, req.body);
            res.status(200).json(content);
        } catch (error) {
            return sendError(res, error);
        }
    },

    deleteContent: async (req, res) => {
        try {
            const { id } = req.params;
            await contentService.deleteContent(id);
            return res.status(204).send();
        } catch (error) {
            return sendError(res, error);
        }
    },

    getUploadUrl: async (req, res) => {
        try {
            const payload = await storageService.getUploadUrl(req.body);
            return res.status(200).json(payload);
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
            return res.status(200).json(result);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getContentById: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await contentService.getContentById(id);
            return res.status(200).json(content);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getOfflineData: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await contentService.getOfflineData(id);
            return res.status(200).json(data);
        } catch (error) {
            return sendError(res, error);
        }
    },

    finalizeUpload: async (req, res) => {
        try {
            const content = await contentService.finalizeContentUpload(req.body);
            return res.status(201).json(content);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getQuizOverview: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId ? req.userId : "11111111-1111-1111-1111-111111111111";
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
            const userId = req.userId ? req.userId : "11111111-1111-1111-1111-111111111111";
            const result = await contentService.submitQuiz(id, userId, answers, timeTaken);
            return res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            return sendError(res, error);
        }
    }
};

module.exports = ContentController;
