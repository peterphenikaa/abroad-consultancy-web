const prisma = require('../config/prisma');
const { createError } = require('../utils/appError');
const { pickAllowedFields } = require('../utils/pickAllowedFields');

const ALLOWED_COURSE_UPDATE_FIELDS = [
    'title',
    'description',
    'thumbnailUrl',
    'subject',
    'curriculum',
    'level',
    'price',
    'isFree',
    'tags',
];

const CourseService = {

    createCourse: async (courseData) => {
        return await prisma.course.create({
            data: { ...courseData, status: 'DRAFT', version: 1 }
        });
    },

    updateCourse: async (courseId, newData) => {
        const currentCourse = await prisma.course.findUnique({ where: { courseId } });

        if (!currentCourse) throw createError('Course not found!', 404);
        const statusUpdate = currentCourse.status === 'PUBLISHED' ? 'DRAFT' : currentCourse.status;
        const safeData = pickAllowedFields(newData, ALLOWED_COURSE_UPDATE_FIELDS);
        if (Object.keys(safeData).length === 0) {
            throw createError("No valid fields to update", 400);
        }
        return await prisma.course.update({
            where: { courseId },
            data: {
                ...safeData,
                status: statusUpdate,
                version: currentCourse.version + 1
            }
        });

    },

    deleteCourse: async (courseId) => {
        const course = await prisma.course.findUnique({ where: { courseId } });
        if (!course) {
            throw createError('Course not found!', 404);
        }
        return await prisma.course.delete({ where: { courseId } });
    },

    publishCourse: async (courseId) => {
        const course = await prisma.course.findUnique({
            where: { courseId },
            select: { courseId: true, status: true }
        });

        if (!course) {
            throw createError('Course not found!', 404);
        }
        if (course.status === 'ARCHIVED') {
            throw createError('Cannot publish archived course', 409);
        }

        const moduleCount = await prisma.module.count({ where: { courseId, status: 'PUBLISHED' } });

        if (moduleCount === 0) {
            throw createError('Cannot publish course without any published modules!', 409);
        }
        return await prisma.course.update({
            where: { courseId },
            data: { status: 'PUBLISHED' }
        });
    },

    getAllCourse: async ({ page = 1, limit = 10 }) => {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const skip = (safePage - 1) * safeLimit;
        const [items, total] = await prisma.$transaction([
            prisma.course.findMany({
                where: { status: { not: 'ARCHIVED' } },
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.course.count({ where: { status: { not: 'ARCHIVED' } } }),
        ]);
        return {
            data: items,
            pagination: {
                page:safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            },
        };
    },

    getCourseById: async (courseId) => {
        const course = await prisma.course.findUnique({ where: { courseId } });
        if (!course) throw createError('Course not found!', 404);
        return course;
    }
};

module.exports = CourseService;