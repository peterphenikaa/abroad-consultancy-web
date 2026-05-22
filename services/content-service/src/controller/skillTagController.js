const skillTagService = require('../services/skillTagService');
const contentService = require('../services/contentService');
const { sendError } = require('../utils/appError');

const SkillTagController = {
    getSkillTags: async (req, res) => {
        try {
            const { contentId } = req.params;
            const tags = await skillTagService.getSkillTags(contentId);
            return res.status(200).json({ status: 'success', skillTags: tags });
        } catch (error) {
            return sendError(res, error);
        }
    },

    getAllSkillTags: async (req, res) => {
        try {
            const tags = await skillTagService.getAllSkillTags();
            return res.status(200).json({ status: 'success', skillTags: tags });
        } catch (error) {
            return sendError(res, error);
        }
    }
}

module.exports = SkillTagController;
