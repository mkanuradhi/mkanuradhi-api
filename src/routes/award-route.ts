import express from 'express';
import * as awardController from '../controllers/award-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';
import upload from '../middleware/file-upload';

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

// Activate or deactivate an award
awardRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.toggleAwardActivation);

// Upload primary image for an award
awardRoute.patch('/:id/primary-image', requireAuthenticated([Role.ADMIN]), upload.single('primaryImage'), awardController.uploadPrimaryImage);

// Upload issuer image for an award
awardRoute.patch('/:id/issuer-image', requireAuthenticated([Role.ADMIN]), upload.single('issuerImage'), awardController.uploadIssuerImage);

// Delete an award
awardRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.deleteAward);

// Delete the primary image of an award
awardRoute.delete('/:id/primary-image', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.deletePrimaryImage);

// Delete the issuer image of an award
awardRoute.delete('/:id/issuer-image', requireAuthenticated([Role.ADMIN]), validateObjectId, awardController.deleteIssuerImage);

export default awardRoute;
