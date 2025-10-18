import express from 'express';
import * as awardController from '../controllers/award-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';

const awardRoute = express.Router();

// Add a new award (en text data)
awardRoute.post('/', awardController.createAwardEn);

// Fetch all awards
awardRoute.get('/', awardController.getAwards);

// Fetch a specific award by ID
awardRoute.get('/:id', validateObjectId, awardController.getAward);

// Update award data (partial update only for en text data)
awardRoute.patch('/:id/en', validateObjectId, awardController.updateAwardEn);

export default awardRoute;
