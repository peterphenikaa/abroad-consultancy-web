const lessonService = require('../services/lessonService');
const { sendError } = require('../utils/appError');
const { resolveUserId } = require('../utils/resolveUserId');

const LessonController = {
    createLesson: async (req, res) => {
        try {
            const lesson = await lessonService.createLesson(req.body);
            return res.status(201).json(lesson);
        } catch (error) {
            return sendError(res, error);
        }
    },

    updateLesson: async (req, res) => {
        try {
            const { id } = req.params;
            const lesson = await lessonService.updateLesson(id, req.body);
            return res.status(200).json(lesson);
        } catch (error) {
            return sendError(res, error);
        }
    },

    deleteLesson: async (req, res) => {
        try {
            const { id } = req.params;
            await lessonService.deleteLesson(id);
            return res.status(204).send();
        } catch (error) {
            return sendError(res, error);
        }
    },

    publishLesson: async (req, res) => {
        try {
            const { id } = req.params;
            const lesson = await lessonService.publishLesson(id);
            return res.status(200).json(lesson);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getAllLesson: async (req, res) => {
        try {
            const safePage = Math.max(1, Number(req.query.page) || 1);
            const safeLimit = Math.max(1, Number(req.query.limit) || 10);
            const moduleId = req.query.moduleId;
            const result = await lessonService.getAllLesson({ moduleId, page: safePage, limit: safeLimit });
            return res.status(200).json(result);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getLessonById: async (req, res) => {
        try {
            const { id } = req.params;
            const lesson = await lessonService.getLessonById(id);
            return res.status(200).json(lesson);
        } catch (error) {
            return sendError(res, error);
        }
    },

    markContentCompleted: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const progress = await lessonService.markContentCompleted(id, userId);
            return res.status(200).json(progress);
        } catch (error) {
            return sendError(res, error);
        }
    }
};

module.exports = LessonController;