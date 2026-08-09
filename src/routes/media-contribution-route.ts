import express from 'express';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import { validate } from '../middleware/validate-middleware';
import { createMediaContributionSchema } from '../validators/media-contribution-validator';
import * as mediaContributionController from '../controllers/media-contribution-controller';

const mediaContributionRoute = express.Router();

// Add a new media contribution
mediaContributionRoute.post('/', requireAuthenticated([Role.ADMIN]), validate(createMediaContributionSchema), mediaContributionController.createMediaContribution);

// Fetch active localized media contributions (public)
mediaContributionRoute.get('/localized', mediaContributionController.getLocalizedMediaContributions);

// Fetch active localized media contribution by path (public)
mediaContributionRoute.get('/localized/:path', mediaContributionController.getLocalizedMediaContributionByPath);

export default mediaContributionRoute;