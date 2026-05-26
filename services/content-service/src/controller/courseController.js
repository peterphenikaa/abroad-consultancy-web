const courseService = require('../services/courseService');

function sendError(res, error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
}

function resolveUserId(req) {
    return req.headers['x-user-id'] || null;
}

const WEBHOOK_HEADER = 'x-payment-webhook-secret';

const emptyStats = {
    coursesEnrolled: 0,
    averageProgress: 0,
    contentCompleted: 0,
    totalContents: 0,
    streak: { days: 0, weekDays: [] },
};

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
            const userId = resolveUserId(req);
            const course = await courseService.getCourseById(id, userId);
            return res.status(200).json(course);
        } catch (error) {
            return sendError(res, error);
        }
    },

    getCourseAccess: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = resolveUserId(req);
            const status = await courseService.getCourseAccessStatus(id, userId);
            return res.status(200).json({ success: true, data: status });
        } catch (error) {
            return sendError(res, error);
        }
    },

    enrollFromPayment: async (req, res) => {
        try {
            const secret = req.headers[WEBHOOK_HEADER];
            if (!secret || secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id } = req.params;
            const { userId } = req.body || {};
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            await courseService.enrollUser(userId, id);
            return res.status(200).json({ success: true });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getUserStats: async (req, res) => {
        try {
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(200).json({ success: true, data: emptyStats });
            }
            const stats = await courseService.getUserStats(userId);
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
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(200).json({ success: true, data: [] });
            }
            const courses = await courseService.getMyActiveCourses(userId);

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
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(200).json({ success: true, data: [] });
            }
            const milestones = await courseService.getMilestones(userId);
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
