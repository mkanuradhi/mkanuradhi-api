import express from 'express';
import * as courseController from '../controllers/course-controller';

const courseRoute = express.Router();

// Add a new course (en text data)
courseRoute.post('/', courseController.createCourseEn);

export default courseRoute;