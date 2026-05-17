const courseService = require('../services/courseService');

function sendError(res, error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
}

const CourseController = {
    createCourse: async (req, res) => {
        try {
            const course = await courseService.createCourse(req.body);
            return res.status(201).json(course);
        } catch (error) {
            return sendError(res, error);
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const course = await courseService.updateCourse(id, req.body);
            return res.status(200).json(course);
        } catch (error) {
            return sendError(res, error);
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;
            await courseService.deleteCourse(id);
            return res.status(204).send();
        } catch (error) {
            return sendError(res, error);
        }
    },

    publishCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const course = await courseService.publishCourse(id);
            return res.status(200).json(course);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getAllCourse: async (req, res) => {
        try {
            const safePage = Math.max(1, Number(req.query.page) || 1);
            const safeLimit = Math.max(1, Number(req.query.limit) || 10);
            const result = await courseService.getAllCourse({ page: safePage, limit: safeLimit });
            return res.status(200).json(result);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getCourseById: async (req, res) => {
        try {
            const { id } = req.params;
            const course = await courseService.getCourseById(id);
            return res.status(200).json(course);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getUserStats: async (req, res) => {
        try {
            const mockUserId = "11111111-1111-1111-1111-111111111111";
            const stats = await courseService.getUserStats(mockUserId);
            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getMyActiveCourses: async (req, res) => {
        try {
            const mockUserId = "11111111-1111-1111-1111-111111111111";
            const courses = await courseService.getMyActiveCourses(mockUserId);

            return res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getMilestones: async (req, res) => {
        try {
            const mockUserId = "11111111-1111-1111-1111-111111111111";
            const milestones = await courseService.getMilestones(mockUserId);
            return res.status(200).json({
                success: true,
                data: milestones
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ 
                status: 'error',
                error: err.message 
            });
        }
    }
};

module.exports = CourseController;
