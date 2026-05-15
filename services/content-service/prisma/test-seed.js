const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mockUserId = "11111111-1111-1111-1111-111111111111";

    const enrollment = await prisma.enrollment.findFirst({
        where: { userId: mockUserId },
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

    if (!enrollment) {
        return console.log("User chưa đăng ký khóa học nào. Vui lòng chạy đăng ký trước.");
    }

    const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
    const allContents = allLessons.flatMap(l => l.contentItems);

    if (allContents.length === 0) {
        return console.log("Khóa học này chưa có nội dung (ContentItem) nào để hoàn thành cả.");
    }

    const firstContent = allContents[0];
    console.log(`Đang đánh dấu hoàn thành nội dung: "${firstContent.title || firstContent.type}"...`);

    await prisma.contentProgress.upsert({
        where: {
            userId_contentId: {
                userId: mockUserId,
                contentId: firstContent.contentId
            }
        },
        update: {
            isCompleted: true,
            completedAt: new Date()
        },
        create: {
            userId: mockUserId,
            contentId: firstContent.contentId,
            isCompleted: true,
            completedAt: new Date()
        }
    });

    console.log("Thành công! User đã completed 1 content item. Vào F5 kiểm tra UI xem.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());