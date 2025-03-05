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

export default courseRoute;