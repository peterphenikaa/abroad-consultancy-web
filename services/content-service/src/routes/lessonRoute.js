const express = require('express');
const router = express.Router();
const LessonController = require('../controller/lessonController');

router.post('/', LessonController.createLesson);
router.put('/:id', LessonController.updateLesson);
router.delete('/:id', LessonController.deleteLesson);
router.patch('/:id/publish', LessonController.publishLesson);
router.get('/', LessonController.getAllLesson);
router.get('/:id', LessonController.getLessonById);

module.exports = router;