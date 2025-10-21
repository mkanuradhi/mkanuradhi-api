import express from 'express';
import * as awardController from '../controllers/award-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';

const awardRoute = express.Router();

// Search awards by query
awardRoute.get('/search', awardController.searchAwards);

// Add a new award (en text data)
awardRoute.post('/', requireAuthenticated([Role.ADMIN]), awardController.createAwardEn);

// Fetch all awards
awardRoute.get('/', awardController.getAwards);

// Fetch a specific award by ID
awardRoute.get('/:id', validateObjectId, awardController.getAward);

// Update award data (partial update only for en text data)
awardRoute.patch('/:id/en', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.updateAwardEn);

// Update award si text data (partial update only for si text data)
awardRoute.patch('/:id/si', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.updateAwardSi);

// Activate or deactivate a award
awardRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.toggleAwardActivation);

// Delete a award
awardRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.deleteAward);


export default awardRoute;
