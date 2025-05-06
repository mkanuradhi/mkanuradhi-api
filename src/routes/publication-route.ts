import express from 'express';
import * as publicationController from '../controllers/publication-controller';
import validateObjectId from '../middleware/validate-objectid';

const publicationRoute = express.Router();

// Add a new publication
publicationRoute.post('/', publicationController.createPublication);

// Fetch all publications
publicationRoute.get('/', publicationController.getPublications);

// Get all publications grouped by type
publicationRoute.get('/grouped', publicationController.getGroupedPublications);

// Get publication by id
publicationRoute.get('/:id', publicationController.getPublicationById);

// Update publication
publicationRoute.patch('/:id', validateObjectId, publicationController.updatePublication);

// Activate or deactivate a publication
publicationRoute.patch('/:id/toggle', validateObjectId, publicationController.togglePublicationActivation);

// Delete a publication
publicationRoute.delete('/:id', validateObjectId, publicationController.deletePublication);

export default publicationRoute;