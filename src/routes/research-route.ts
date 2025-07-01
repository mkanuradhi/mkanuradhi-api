import express from 'express';
import * as researchController from '../controllers/research-controller';

const researchRoute = express.Router();

// Add a new research
researchRoute.post('/', researchController.createResearch);

// Fetch all research
researchRoute.get('/', researchController.getResearches);

// Get research by id
researchRoute.get('/:id', researchController.getResearchById);

export default researchRoute;