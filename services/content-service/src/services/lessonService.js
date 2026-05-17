const prisma = require('../config/prisma');
const { createError } = require('../utils/appError');
const { pickAllowedFields } = require('../utils/pickAllowedFields');

const ALLOWED_LESSON_UPDATE_FIELDS = [
    'title',
    'objectives',
    'duration',
    'orderIndex',
];

const LessonService = {
    createLesson: async (lessonData) => {
        const existingLesson = await prisma.lesson.findFirst({
            where: {
                moduleId: lessonData.moduleId,
                orderIndex: lessonData.orderIndex
            }
        });
        if (existingLesson) throw createError('Lesson order already exists!', 409);
        return await prisma.lesson.create({ data: { ...lessonData, status: 'DRAFT' } });
    },

    updateLesson: async (lessonId, newData) => {
        const currentLesson = await prisma.lesson.findUnique({ where: { lessonId } });
        if (!currentLesson) throw createError('Lesson not found!', 404);
        const statusUpdate = currentLesson.status === 'PUBLISHED' ? 'DRAFT' : currentLesson.status;
        const safeData = pickAllowedFields(newData, ALLOWED_LESSON_UPDATE_FIELDS);
        if (Object.keys(safeData).length === 0) {
            throw createError("No valid fields to update", 400);
        }
        return await prisma.lesson.update({
            where: { lessonId },
            data: { ...safeData, status: statusUpdate }
        });
    },

    deleteLesson: async (lessonId) => {
        const lesson = await prisma.lesson.findUnique({ where: { lessonId } });
        if (!lesson) {
            throw createError('Lesson not found!', 404);
        }
        return await prisma.lesson.delete({ where: { lessonId } });
    },

    publishLesson: async (lessonId) => {
        const lesson = await prisma.lesson.findUnique({
            where: { lessonId },
            select: {
                lessonId: true,
                status: true,
                module: {
                    select: {
                        moduleId: true,
                        status: true,
                        course: {
                            select: { courseId: true, status: true }
                        }
                    }
                }
            }
        });

        if (!lesson) {
            throw createError('Lesson not found!', 404);
        }
        if (!lesson.module) {
            throw createError('Parent module not found', 404);
        }
        if (lesson.module.status === 'HIDDEN') {
            throw createError('Cannot publish lesson under hidden module', 409);
        }
        if (!lesson.module.course || lesson.module.course.status === 'ARCHIVED') {
            throw createError('Cannot publish lesson under archived course', 409);
        }

        const contentCount = await prisma.contentItem.count({ where: { lessonId } });
        if (contentCount === 0) throw createError('Cannot publish lesson without any content!', 409);

        return await prisma.lesson.update({
            where: { lessonId },
            data: { status: 'PUBLISHED' }
        });
    },

    getAllLesson: async ({moduleId, page = 1, limit = 10 }) => {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const skip = (safePage - 1) * safeLimit;
        const where = {
            status: { not: 'HIDDEN' },
        };
        if (moduleId) {
            where.moduleId = moduleId;
        }
        const [items, total] = await prisma.$transaction([
            prisma.lesson.findMany({
                where,
                skip,
                take: safeLimit,    
                orderBy: { orderIndex: 'asc' },       
            }),
            prisma.lesson.count({ where }),
        ]);
        return {
            data: items,
            pagination: {
                page: safePage,
                limit:safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            },
        };
    },

    getLessonById: async (lessonId) => {
        const lesson = await prisma.lesson.findUnique({ where: { lessonId } });
        if (!lesson) throw createError('Lesson not found!', 404);
        return lesson;
    },

    //mock tạm userId để test: 11111111-1111-1111-1111-111111111111
    markContentCompleted: async (contentId, userId="11111111-1111-1111-1111-111111111111") => {
        const existingProgress = await prisma.contentProgress.findUnique({
            where: {
                userId_contentId: { userId, contentId }
            }
        });

        if (!existingProgress) {
            return await prisma.contentProgress.create({
                data: {
                    userId,
                    contentId,
                    isCompleted: true,
                    completedAt: new Date()
                }
            });
        }
        if (!existingProgress.isCompleted) {
            return await prisma.contentProgress.update({
                where: {
                    id: existingProgress.id
                },
                data: {
                    isCompleted: true,
                    completedAt: new Date()
                }
            });
        }
        return existingProgress;
    }
};


module.exports = LessonService;
