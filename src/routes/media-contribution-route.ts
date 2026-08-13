import express from 'express';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import { validate } from '../middleware/validate-middleware';
import { createMediaContributionSchema, updateMediaContributionSchema } from '../validators/media-contribution-validator';
import * as mediaContributionController from '../controllers/media-contribution-controller';
import validateObjectId from '../middleware/validate-objectid';

const mediaContributionRoute = express.Router();

// Fetch all media contributions
mediaContributionRoute.get('/', requireAuthenticated([Role.ADMIN]), mediaContributionController.getMediaContributions);

// Fetch a specific media contribution by ID
mediaContributionRoute.get('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.getMediaContribution);

// Add a new media contribution
mediaContributionRoute.post('/', requireAuthenticated([Role.ADMIN]), validate(createMediaContributionSchema), mediaContributionController.createMediaContribution);

// Update media contribution data
mediaContributionRoute.put('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(updateMediaContributionSchema), mediaContributionController.updateMediaContribution);

// Delete an media contribution
mediaContributionRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.deleteMediaContribution);

// Fetch active localized media contributions (public)
mediaContributionRoute.get('/localized', mediaContributionController.getLocalizedMediaContributions);

// Fetch active localized media contribution by path (public)
mediaContributionRoute.get('/localized/:path', mediaContributionController.getLocalizedMediaContributionByPath);

export default mediaContributionRoute;