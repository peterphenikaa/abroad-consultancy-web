const prisma = require('../config/prisma');
const { createError } = require('../utils/appError');

const SkillTagService = {
    getSkillTags: async (contentId) => {
        const content = await prisma.contentItem.findUnique({
            where: {contentId},
        });
        if (!content || content.type !== 'QUIZ') {
            throw createError('Content không tồn tại hoặc không phải là quiz', 404);
        }
        const questions = content.metadata?.questions || [];
        const tags = new Set();

        questions.forEach(q => {
            if (q.skillTags && Array.isArray(q.skillTags)) {
                q.skillTags.forEach(tag => tags.add(tag));
            }
        });

        return Array.from(tags);
    }, 

    getAllSkillTags: async () => {
        const tags = await prisma.skillTags.findMany();
        return tags;
    }
}

module.exports = SkillTagService;