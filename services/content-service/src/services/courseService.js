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
    'accessDurationDays',
];

const CourseService = {

    createCourse: async (courseData) => {
        let accessDurationDays = courseData.accessDurationDays;
        if (accessDurationDays !== undefined && accessDurationDays !== null) {
            accessDurationDays = parseInt(accessDurationDays, 10);
        }
        return await prisma.course.create({
            data: { ...courseData, accessDurationDays, status: 'DRAFT', version: 1 }
        });
    },

    updateCourse: async (courseId, newData) => {
        const currentCourse = await prisma.course.findUnique({ where: { courseId } });

        if (!currentCourse) throw createError('Course not found!', 404);
        const statusUpdate = currentCourse.status === 'PUBLISHED' ? 'DRAFT' : currentCourse.status;
        const safeData = pickAllowedFields(newData, ALLOWED_COURSE_UPDATE_FIELDS);

        if (accessDurationDays !== undefined && accessDurationDays !== null) {
            safeData.accessDurationDays = parseInt(safeData.accessDurationDays, 10);
        }
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
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            },
        };
    },

    getCourseById: async (courseId, userId = "11111111-1111-1111-1111-111111111111") => {
        const course = await prisma.course.findUnique({
            where: { courseId },
            include: {
                enrollments: {
                    where: { userId }
                },
                modules: {
                    include: {
                        lessons: {
                            include: {
                                contentItems: {
                                    orderBy: { orderIndex: 'asc' },
                                    include: {
                                        progresses: {
                                            where: { userId, isCompleted: true }
                                        }
                                    }
                                }
                            },
                            orderBy: { orderIndex: 'asc' }
                        }
                    },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!course) throw createError('Course not found!', 404);

        let deadline = null;
        if (course.enrollments && course.enrollments.length > 0) {
            deadline = course.enrollments[0].expiresAt;
        } else {
            if (course.accessDurationDays) {
                const fakeDeadline = new Date();
                fakeDeadline.setDate(fakeDeadline.getDate() + course.accessDurationDays);
                deadline = fakeDeadline;
            }
        }

        const formattedCourse = {
            ...course,
            id: course.courseId,
            deadline: deadline,
            modules: course.modules.map(mod => ({
                ...mod,
                id: mod.moduleId,
                isCompleted: mod.lessons.length > 0 && mod.lessons.every(l => l.contentItems.length > 0 && l.contentItems.every(ci => ci.progresses.length > 0)),
                lessons: mod.lessons.map(les => {
                    const isLessonCompleted = les.contentItems.length > 0 && les.contentItems.every(ci => ci.progresses.length > 0);
                    return {
                        ...les,
                        id: les.lessonId,
                        isCompleted: isLessonCompleted,
                        contentItems: les.contentItems.map(ci => ({
                            ...ci,
                            id: ci.contentId,
                            url: ci.contentUrl,
                            isCompleted: ci.progresses.length > 0
                        }))
                    };
                })
            }))
        };

        return formattedCourse;
    },

    getUserStats: async (userId) => {
        const coursesEnrolled = await prisma.enrollment.count({
            where: { userId, status: 'ACTIVE' },
        });
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            select: { courseId: true },
        });
        const erolledCourseIds = enrollments.map(e => e.courseId);
        const totalContents = await prisma.contentItem.count({
            where: {
                lesson: {
                    module: {
                        courseId: { in: erolledCourseIds },
                    }
                }
            }
        });
        const contentCompleted = await prisma.contentProgress.count({
            where: { userId, isCompleted: true },
        });
        let averageProgress = 0;
        if (totalContents > 0) {
            averageProgress = Math.round((contentCompleted / totalContents) * 100);
        }
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const recentProgresses = await prisma.contentProgress.findMany({
            where: {
                userId,
                completedAt: { gte: startOfWeek },
            },
            select: { completedAt: true },
        });
        const labels = ["M", "T", "W", "T", "F", "S", "S"];
        const weekDays = labels.map(label => ({ label, active: false }));
        let totalActiveDays = 0;
        recentProgresses.forEach(p => {
            if (p.completedAt) {
                const d = new Date(p.completedAt);
                const dayIndex = d.getDay();
                const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                if (!weekDays[mappedIndex].active) {
                    weekDays[mappedIndex].active = true;
                    totalActiveDays++;
                }
            }
        });
        const streak = {
            days: totalActiveDays,
            weekDays
        };

        return {
            coursesEnrolled,
            totalContents,
            contentCompleted,
            averageProgress,
            streak
        };
    },

    getMyActiveCourses: async (userId) => {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            include: {
                course: {
                    include: {
                        modules: {
                            include: {
                                lessons: {
                                    include: { contentItems: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = await Promise.all(enrollments.map(async (enrollment) => {
            const course = enrollment.course;
            const allLessons = course.modules.flatMap(m => m.lessons);
            const allContents = allLessons.flatMap(l => l.contentItems);
            const totalContents = allContents.length;
            const contentIds = allContents.map(c => c.contentId);

            const completedProgresses = await prisma.contentProgress.findMany({
                where: { userId, contentId: { in: contentIds }, isCompleted: true },
                select: { contentId: true }
            });
            const completedIds = completedProgresses.map(p => p.contentId);
            const completedCount = completedIds.length;
            const progressPercent = totalContents === 0 ? 0 : Math.round((completedCount / totalContents) * 100);

            const nextContent = allContents.find(c => !completedIds.includes(c.contentId));
            const nextLessonTitle = nextContent ? allLessons.find(l => l.lessonId === nextContent.lessonId)?.title : "All lessons completed";

            return {
                id: course.courseId,
                subject: course.subject || "General",
                title: course.title,
                nextLessonTitle: nextLessonTitle,
                completedItems: completedCount,
                totalItems: totalContents,
                progressPercent: progressPercent,
                dueDate: enrollment.expiresAt ? enrollment.expiresAt.toLocaleDateString('en-US') : "No deadline"
            };
        }));
        return result;
    },

    getMilestones: async (userId) => {
        const milestones = await prisma.milestone.findMany({
            where: { userId },
            orderBy: { targetDate: 'asc' }
        });
        return milestones.map(m => ({
            ...m,
            targetDate: m.targetDate ? m.targetDate.toLocaleDateString('en-US') : null
        }));
    }
};

module.exports = CourseService;
