const express = require('express');
const router = express.Router();
const CourseController = require('../controller/courseController');

router.post('/', CourseController.createCourse);
router.get('/my-stats', CourseController.getUserStats);
router.get('/my-courses', CourseController.getMyActiveCourses);
router.post('/:id/enroll-from-payment', CourseController.enrollFromPayment);
router.get('/:id/access', CourseController.getCourseAccess);

router.patch('/:id/publish', CourseController.publishCourse);
router.patch('/:id', CourseController.updateCourse);
router.delete('/:id', CourseController.deleteCourse);
router.get('/', CourseController.getAllCourse);
router.get('/my-milestones', CourseController.getMilestones);
router.get('/:id', CourseController.getCourseById);

module.exports = router;