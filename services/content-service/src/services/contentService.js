const prisma = require('../config/prisma');
const storageService = require('./storageService');
const { createError } = require('../utils/appError');
const { pickAllowedFields } = require('../utils/pickAllowedFields');

const ALLOWED_CONTENT_UPDATE_FIELDS = [
    'type',
    'title',
    'description',
    'contentUrl',
    'metadata',
    'orderIndex',
];
 
const ContentService = {
    createContent: async (contentData) => {

        const lesson = await prisma.lesson.findUnique({
            where: { lessonId: contentData.lessonId },
            select: { lessonId: true, status: true },
        });
        if (!lesson) throw createError('Lesson not found!', 404);

        const existingContent = await prisma.contentItem.findFirst({
            where: {
                lessonId: contentData.lessonId,
                orderIndex: contentData.orderIndex
            }
        });
        if (existingContent) throw createError('Content order already exists!', 409);
        return await prisma.contentItem.create({
            data: {
                lessonId: contentData.lessonId,
                type: contentData.type,
                title: contentData.title,
                description: contentData.description,
                contentUrl: contentData.contentUrl,
                metadata: contentData.metadata,
                orderIndex: contentData.orderIndex,
                status: 'DRAFT',
            }
        });
    },

    finalizeContentUpload: async (payload) => {
        const {
            lessonId,
            type,
            title,
            description,
            orderIndex,
            bucket,
            objectKey,
            metadata,
        } = payload;

        if (!lessonId || !type || !title || orderIndex === undefined || !bucket || !objectKey) {
            throw createError('lessonId, type, title, orderIndex, bucket, objectKey are required');
        }

        const lesson = await prisma.lesson.findUnique({
            where: { lessonId },
            select: { lessonId: true, status: true },
        });
        if (!lesson) throw createError('Lesson not found', 404);

        const existsOrder = await prisma.contentItem.findFirst({
            where: { lessonId, orderIndex: Number(orderIndex) },
            select: { contentId: true },
        });
        if (existsOrder) throw createError('orderIndex already exists in this lesson', 409);
        await storageService.verifyUploadedObject({ bucket, objectKey });

        const contentUrl = `${bucket}/${objectKey}`;
        const normalizedType = String(type).toUpperCase();

        if (!['VIDEO', 'DOCUMENT'].includes(normalizedType)) {
            throw createError('type must be VIDEO or DOCUMENT');
        }

        return prisma.contentItem.create({
            data: {
                lessonId,
                type: normalizedType,
                title,
                description: description || null,
                contentUrl,
                metadata: metadata || {},
                orderIndex: Number(orderIndex),
                status: 'DRAFT',
            },
        });
    },

    updateContent: async (contentId, newData) => {
        const currentContent = await prisma.contentItem.findUnique({ where: { contentId } });
        if (!currentContent) throw createError('Content not found!', 404);
        const statusUpdate = currentContent.status === 'PUBLISHED' ? 'DRAFT' : currentContent.status;
        const safeData = pickAllowedFields(newData, ALLOWED_CONTENT_UPDATE_FIELDS);
        if (Object.keys(safeData).length === 0) {
            throw createError("No valid fields to update", 400);
        }
        return await prisma.contentItem.update({
            where: { contentId },
            data: { ...safeData, status: statusUpdate }
        });
    },

    deleteContent: async (contentId) => {
        const content = await prisma.contentItem.findUnique({ where: { contentId } });
        if (!content) {
            throw createError('Content not found!', 404);
        }
        return await prisma.contentItem.delete({ where: { contentId } });
    },

    publishContent: async (contentId) => {
        return await prisma.contentItem.update({
            where: { contentId },
            data: { status: 'PUBLISHED' }
        });
    },

    getAllContent: async ({lessonId, page = 1, limit = 10 }) => {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const skip = (safePage - 1) * safeLimit;
        const where = {
            status: { not: 'HIDDEN' }
        };
        if (lessonId) {
            where.lessonId = lessonId;
        }
        const [items, total] = await prisma.$transaction([
            prisma.contentItem.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { orderIndex: 'asc' },
            }),
            prisma.contentItem.count({ where }),
        ]);
        return {
            data: items,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    },

    getContentById: async (contentId) => {
        const content = await prisma.contentItem.findUnique({ where: { contentId } });
        if (!content) throw createError('Content not found!', 404);
        return content;
    }
};

module.exports = ContentService;