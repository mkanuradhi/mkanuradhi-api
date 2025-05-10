import express from 'express';
import * as mcqController from '../controllers/mcq-controller';
import validateObjectId from '../middleware/validate-objectid';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const mcqRoute = express.Router();

// Add a new mcq
mcqRoute.post('/:quizId/mcqs', requireAuthenticated([Role.ADMIN]), mcqController.createMcq);

// Fetch all mcqs for a quiz
mcqRoute.get('/:quizId/mcqs', mcqController.getMcqs);

// Fetch active mcqs for a quiz
mcqRoute.get('/:quizId/mcqs/active', mcqController.getActiveMcqs);

// Fetch mcq
mcqRoute.get('/:quizId/mcqs/:id', mcqController.getMcq);

// Update mcq
mcqRoute.patch('/:quizId/mcqs/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, mcqController.updateMcq);

// Toggle status of a mcq
mcqRoute.patch('/:quizId/mcqs/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, mcqController.toggleMcqActivation);

// Delete a mcq
mcqRoute.delete('/:quizId/mcqs/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, mcqController.deleteMcq);

export default mcqRoute;
