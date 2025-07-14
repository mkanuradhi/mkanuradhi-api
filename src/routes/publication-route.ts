import express from 'express';
import * as publicationController from '../controllers/publication-controller';
import validateObjectId from '../middleware/validate-objectid';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const publicationRoute = express.Router();

// Add a new publication
publicationRoute.post('/', requireAuthenticated([Role.ADMIN]), publicationController.createPublication);

// Fetch all publications
publicationRoute.get('/', publicationController.getPublications);

// Get all publications grouped by type
publicationRoute.get('/grouped', publicationController.getGroupedPublications);

// Get publication by id
publicationRoute.get('/:id', publicationController.getPublicationById);

// Update publication
publicationRoute.put('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, publicationController.updatePublication);

// Activate or deactivate a publication
publicationRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, publicationController.togglePublicationActivation);

// Delete a publication
publicationRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, publicationController.deletePublication);

// Get publications by year
publicationRoute.get('/stats/yearly', publicationController.getYearlyPublications);

// Get publications by yearly by type
publicationRoute.get('/stats/yearly-by-type', publicationController.getYearlyPublicationsByType);

// Get publications by type
publicationRoute.get('/stats/by-type', publicationController.getPublicationsByType);

export default publicationRoute;