import express from 'express';
import * as researchController from '../controllers/research-controller';
import validateObjectId from '../middleware/validate-objectid';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const researchRoute = express.Router();

// Add a new research
researchRoute.post('/', requireAuthenticated([Role.ADMIN]), researchController.createResearch);

// Fetch all research
researchRoute.get('/', researchController.getResearches);

// Get research by id
researchRoute.get('/:id', researchController.getResearchById);

// Update research
researchRoute.put('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, researchController.updateResearch);

// Activate or deactivate a research
researchRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, researchController.toggleResearchActivation);

// Delete a research
researchRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, researchController.deleteResearch);

// Get research summary
researchRoute.get('/stats/summary', researchController.getResearchSummary);

export default researchRoute;