import express from 'express';
import * as researchController from '../controllers/research-controller';
import validateObjectId from '../middleware/validate-objectid';

const researchRoute = express.Router();

// Add a new research
researchRoute.post('/', researchController.createResearch);

// Fetch all research
researchRoute.get('/', researchController.getResearches);

// Get research by id
researchRoute.get('/:id', researchController.getResearchById);

// Update research
researchRoute.put('/:id', validateObjectId, researchController.updateResearch);

export default researchRoute;