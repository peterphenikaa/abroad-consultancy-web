const prisma = require('../config/prisma');
const { createError } = require('../utils/appError');
const { pickAllowedFields } = require('../utils/pickAllowedFields');

const ALLOWED_MODULE_UPDATE_FIELDS = [
    'title',
    'description',
    'orderIndex',
];

const ModuleService = {
    createModule: async (moduleData) => {
        const existingModule = await prisma.module.findFirst({
            where: { courseId: moduleData.courseId, orderIndex: moduleData.orderIndex }
        });
        if (existingModule) throw createError('Module order already exists!', 409);
        return await prisma.module.create({ data: { ...moduleData, status: 'DRAFT' } });
    },

    updateModule: async (moduleId, newData) => {
        const currentModule = await prisma.module.findUnique({ where: { moduleId } });
        if (!currentModule) throw createError('Module not found!', 404);
        const statusUpdate = currentModule.status === 'PUBLISHED' ? 'DRAFT' : currentModule.status;
        const safeData = pickAllowedFields(newData, ALLOWED_MODULE_UPDATE_FIELDS);
        if (Object.keys(safeData).length === 0) {
            throw createError("No valid fields to update", 400);
        }
        return await prisma.module.update({
            where: { moduleId },
            data: { ...safeData, status: statusUpdate }
        });
    },

    deleteModule: async (moduleId) => {
        const module = await prisma.module.findUnique({ where: { moduleId } });
        if (!module) {
            throw createError('Module not found!', 404);
        }
        return await prisma.module.delete({ where: { moduleId } });
    },

    publishModule: async (moduleId) => {
        const module = await prisma.module.findUnique({
            where: { moduleId },
            select: {
                moduleId: true,
                status: true,
                course: {
                    select: { courseId: true, status: true }
                }
            }
        });

        if (!module) {
            throw createError('Module not found!', 404);
        }
        if (!module.course) {
            throw createError('Parent course not found', 404);
        }
        if (module.course.status === 'ARCHIVED') {
            throw createError('Cannot publish module of archived course', 409);
        }

        const lessonCount = await prisma.lesson.count({ where: { moduleId } });
        if (lessonCount === 0) {
            throw createError('Cannot publish module without any lessons!', 409);
        }
        return await prisma.module.update({
            where: { moduleId },
            data: { status: 'PUBLISHED' }
        });
    },

    getAllModule: async ({ courseId, page = 1, limit = 10 }) => {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const skip = (safePage - 1) * safeLimit;
        const where = {
            status: { not: 'HIDDEN' },
        };

        if (courseId) {
            where.courseId = courseId;
        }

        const [items, total] = await prisma.$transaction([
            prisma.module.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { orderIndex: 'asc' },
            }),
            prisma.module.count({ where }),
        ]);
        return {
            data: items,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            },
        };
    },

    getModuleById: async (moduleId) => {
        const module = await prisma.module.findUnique({ where: { moduleId } });
        if (!module) throw createError('Module not found!', 404);
        return module;
    }
};

module.exports = ModuleService;