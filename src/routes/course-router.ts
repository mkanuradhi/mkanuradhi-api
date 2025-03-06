import express from 'express';
import * as courseController from '../controllers/course-controller';
import validateObjectId from '../middleware/validate-objectid';

const courseRoute = express.Router();

// Add a new course (en text data)
courseRoute.post('/', courseController.createCourseEn);

// Fetch all course
courseRoute.get('/', courseController.getCourses);

// Update course data (partial update only for en text data)
courseRoute.patch('/:id/en', validateObjectId, courseController.updateCourseEn);

// Update course si text data (partial update only for si text data)
courseRoute.patch('/:id/si', validateObjectId, courseController.updateCourseSi);

// Activate or deactivate a course
courseRoute.patch('/:id/toggle', validateObjectId, courseController.toggleCourseActivation);

// Delete a course
courseRoute.delete('/:id', validateObjectId, courseController.deleteCourse);

export default courseRoute;