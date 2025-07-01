import express from 'express';
import * as researchController from '../controllers/research-controller';

const researchRoute = express.Router();

// Add a new research
researchRoute.post('/', researchController.createResearch);

export default researchRoute;