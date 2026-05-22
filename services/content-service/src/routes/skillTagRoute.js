const express = require('express');
const router = express.Router();
const SkillTagController = require('../controller/skillTagController');

router.get('/content/:contentId', SkillTagController.getSkillTags);
router.get('/', SkillTagController.getAllSkillTags);

module.exports = router;