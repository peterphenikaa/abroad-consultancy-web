const express = require('express');
const router = express.Router();
const CourseController = require('../controller/courseController');

router.post('/', CourseController.createCourse);
router.patch('/:id/publish', CourseController.publishCourse);
router.patch('/:id', CourseController.updateCourse);
router.delete('/:id', CourseController.deleteCourse);
router.get('/', CourseController.getAllCourse);
router.get('/:id', CourseController.getCourseById);

module.exports = router;