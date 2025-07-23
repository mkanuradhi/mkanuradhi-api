import express from 'express';
import * as courseController from '../controllers/course-controller';
import * as quizController from '../controllers/quiz-controller';
import validateObjectId from '../middleware/validate-objectid';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const courseRoute = express.Router();

// Search products by query
courseRoute.get('/search', courseController.searchCourses);

// Add a new course (en text data)
courseRoute.post('/', requireAuthenticated([Role.ADMIN]), courseController.createCourseEn);

// Fetch all courses
courseRoute.get('/', courseController.getCourses);

// Fetch a specific course by ID
courseRoute.get('/id/:id', validateObjectId, courseController.getCourse);

// Fetch a specific course by path
courseRoute.get('/path/:path', courseController.getCourseByPath);

// Update course data (partial update only for en text data)
courseRoute.patch('/:id/en', requireAuthenticated([Role.ADMIN]), validateObjectId, courseController.updateCourseEn);

// Update course si text data (partial update only for si text data)
courseRoute.patch('/:id/si', requireAuthenticated([Role.ADMIN]), validateObjectId, courseController.updateCourseSi);

// Activate or deactivate a course
courseRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, courseController.toggleCourseActivation);

// Delete a course
courseRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, courseController.deleteCourse);

// Get course summary
courseRoute.get('/stats/summary', courseController.getCourseSummary);

// Get yearly courses by type
courseRoute.get('/stats/yearly-by-type', courseController.getYearlyCoursesByType);

// ----------------------------------- quizzes -----------------------------------

// Add a new quiz
courseRoute.post('/:courseId/quizzes', requireAuthenticated([Role.ADMIN]), quizController.createQuiz);

// Fetch all quizzes
courseRoute.get('/:courseId/quizzes', quizController.getQuizzes);

// Fetch all quizzes by course path
courseRoute.get('/path/:coursePath/quizzes', quizController.getQuizzesByCoursePath);

// Fetch quiz
courseRoute.get('/:courseId/quizzes/:id', quizController.getQuiz);

// Fetch quiz by course path and id
courseRoute.get('/path/:coursePath/quizzes/:id', quizController.getQuizByCoursePathAndId);

// Update quiz data
courseRoute.patch('/:courseId/quizzes/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, quizController.updateQuiz);

// Toggle status of a quiz
courseRoute.patch('/:courseId/quizzes/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, quizController.toggleQuizActivation);

// Delete a quiz
courseRoute.delete('/:courseId/quizzes/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, quizController.deleteQuiz);

export default courseRoute;