import express from 'express';
import * as publicationController from '../controllers/publication-controller';

const publicationRoute = express.Router();

// Add a new publication
publicationRoute.post('/', publicationController.createPublication);

// Fetch all publications
publicationRoute.get('/', publicationController.getPublications);

// Get all publications grouped by type
publicationRoute.get('/grouped', publicationController.getGroupedPublications);

export default publicationRoute;