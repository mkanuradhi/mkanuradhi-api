import express from 'express';
import * as mcqController from '../controllers/mcq-controller';
import validateObjectId from '../middleware/validate-objectid';

const mcqRoute = express.Router();

// Add a new mcq
mcqRoute.post('/:quizId/mcqs', mcqController.createMcq);

// Fetch all mcqs for a quiz
mcqRoute.get('/:quizId/mcqs', mcqController.getMcqs);

// Fetch mcq
mcqRoute.get('/:quizId/mcqs/:id', mcqController.getMcq);

// Update mcq
mcqRoute.patch('/:quizId/mcqs/:id', validateObjectId, mcqController.updateMcq);

// Toggle status of a mcq
mcqRoute.patch('/:quizId/mcqs/:id/toggle', validateObjectId, mcqController.toggleMcqActivation);

export default mcqRoute;
