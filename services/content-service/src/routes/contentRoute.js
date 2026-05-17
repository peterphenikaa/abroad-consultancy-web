const express = require('express');
const router = express.Router();
const ContentController = require('../controller/contentController');

router.post('/uploads/presigned', ContentController.getUploadUrl);
router.post('/uploads/finalize', ContentController.finalizeUpload);

router.post('/', ContentController.createContent);
router.patch('/:id', ContentController.updateContent);
router.delete('/:id', ContentController.deleteContent);
router.get('/', ContentController.getAllContent);
router.get('/:id', ContentController.getContentById);
router.post('/:id/submit', ContentController.submitQuiz);
router.get('/:id/quiz-overview', ContentController.getQuizOverview);

module.exports = router;