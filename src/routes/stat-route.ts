import express from 'express';
import * as statController from '../controllers/stat-controller';

const statRoute = express.Router();

// Fetch stats (public)
statRoute.get('/summary', statController.getSummaryStats);

export default statRoute;