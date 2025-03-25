import express from 'express';
import * as mcqController from '../controllers/mcq-controller';

const mcqRoute = express.Router();

// Add a new mcq
mcqRoute.post('/:quizId/mcqs', mcqController.createMcq);

export default mcqRoute;
