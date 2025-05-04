import express from 'express';
import * as publicationController from '../controllers/publication-controller';

const publicationRoute = express.Router();

// Add a new publication
publicationRoute.post('/', publicationController.createPublication);

export default publicationRoute;