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

        const warnings = [];
        if (contentData.type === 'QUIZ' && contentData.metadata?.questions) {
            for (const q in contentData.metadata?.questions) {
                const question = contentData.metadata?.questions[q];
                if (!question.skillTags || !Array.isArray(question.skillTags) || question.skillTags.length === 0) {
                    warnings.push(`Câu hỏi '${question.id || q}' đang thiếu skillTag`);
                }
            }
        }

        if (existingContent) throw createError('Content order already exists!', 409);
        const result = await prisma.contentItem.create({
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

        return {
            ...result,
            warnings: warnings.length > 0 ? warnings : null
        };
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

        const warnings = [];
        if (safeData.type === 'QUIZ' || (currentContent.type === 'QUIZ' && safeData.metadata?.questions)) {
            const questions = safeData.metadata?.questions || currentContent.metadata?.questions || [];
            for (const q in questions) {
                const question = questions[q];
                if (!question.skillTags || !Array.isArray(question.skillTags) || question.skillTags.length === 0) {
                    warnings.push(`Câu hỏi '${question.id || q}' đang thiếu skillTag`);
                }
            }
        }

        const result = await prisma.contentItem.update({
            where: { contentId },
            data: { ...safeData, status: statusUpdate }
        });

        return {
            ...result,
            warnings: warnings.length > 0 ? warnings : null
        };
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

    getAllContent: async ({ lessonId, page = 1, limit = 10 }) => {
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
    },

    getOfflineData: async (contentId) => {
        const content = await prisma.contentItem.findUnique({
            where: { contentId },
            include: {
                lesson: {
                    include: {
                        module: {
                            include: {
                                course: true
                            }
                        }
                    }
                }
            }
        });

        if (!content) throw createError('Content not found!', 404);

        const courseData = {
            id: content.lesson.module.course.courseId,
            title: content.lesson.module.course.title
        };

        const contentData = {
            id: content.contentId,
            courseId: courseData.id,
            title: content.title,
            description: content.description,
            type: content.type,
            metadata: content.metadata || {},
            duration: content.duration,
            contentUrl: content.contentUrl
        };

        const mediaUrls = [];
        if (content.contentUrl) {
            mediaUrls.push(content.contentUrl);
        }

        return {
            courseData,
            contentData,
            mediaUrls
        };
    },

    getQuizOverview: async (contentId, userId) => {
        const content = await prisma.contentItem.findUnique({
            where: { contentId },
            include: {
                quizAttempts: {
                    where: { userId },
                    orderBy: { startedAt: 'desc' },
                }
            }
        });

        if (!content || content.type !== 'QUIZ') {
            throw createError('Quiz content not found!', 404);
        }

        return {
            id: content.contentId,
            title: content.title,
            description: content.description,
            settings: content.metadata || {},
            history: content.quizAttempts
        };
    },

    submitQuiz: async (contentId, userId, answers, timeTaken) => {
        const quizContent = await prisma.contentItem.findUnique({
            where: { contentId },
        });
        if (!quizContent || quizContent.type !== 'QUIZ') {
            throw createError('Quiz content not found!', 404);
        }

        const maxAttempts = quizContent.metadata?.maxAttempts || 3;
        const attemptsCount = await prisma.quizAttempt.count({
            where: { userId, contentId }
        });
        if (attemptsCount >= maxAttempts) {
            throw createError(`Bạn đã hết lượt làm lại (Tối đa: ${maxAttempts} lượt).`, 403);
        }

        const questions = quizContent.metadata?.questions || [];
        let correctCount = 0;
        for (const question of questions) {
            const userAnswer = answers[question.id];
            if (userAnswer === question.correctOptionId) {
                correctCount++;
            }
        }
        const score = Math.round((correctCount / questions.length) * 100);
        const passStatus = score >= (quizContent.metadata?.passingScore || 50) ? 'PASSED' : 'FAILED';

        const completedAt = new Date();
        const startedAt = new Date(completedAt.getTime() - (timeTaken * 1000));

        const attempt = await prisma.quizAttempt.create({
            data: {
                userId,
                contentId,
                score,
                timeTaken: timeTaken,
                status: passStatus,
                startedAt: startedAt,
                completedAt: completedAt,
            }
        });

        if (passStatus === 'PASSED') {
            await prisma.contentProgress.upsert({
                where: {
                    userId_contentId: {
                        userId,
                        contentId
                    }
                },
                update: {
                    isCompleted: true,
                    completedAt: new Date()
                },
                create: {
                    userId,
                    contentId,
                    isCompleted: true,
                    completedAt: new Date()
                }
            });
        }

        const totalAttempts = await prisma.quizAttempt.count({
            where: { userId, contentId }
        });
        return { ...attempt, totalAttempts };
    },

    getContentOfflineData: async (contentId) => {
        const content = await prisma.contentItem.findUnique({
            where: { contentId },
        });
        if (!content) throw createError('Content not found!', 404);
        return {
            courseData: {
                courseId: content.lesson.courseId,
                courseTitle: content.lesson.course.title,
            },
            contentData: {
                contentId: content.contentId,
                courseId: content.lesson.courseId,
                title: content.title,
                bodyText: content.description,
                type: content.type,
            },
            mediaUrls: [content.contentUrl]
        }
    },

};

module.exports = ContentService;