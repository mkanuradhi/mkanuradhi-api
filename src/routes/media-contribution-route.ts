import express from 'express';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import { validate } from '../middleware/validate-middleware';
import { activationMediaContributionSchema, createMediaContributionSchema, MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES, updateMediaContributionSchema } from '../validators/media-contribution-validator';
import * as mediaContributionController from '../controllers/media-contribution-controller';
import validateObjectId from '../middleware/validate-objectid';
import { uploadImage, uploadPdf } from '../middleware/file-upload';
import validateUuid from '../middleware/validate-uuid';
import { reorderPreviewImagesSchema } from '../validators/common-validator';

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

// Activate or deactivate an media contribution
mediaContributionRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(activationMediaContributionSchema), mediaContributionController.toggleMediaContributionActivation);

// Update the cover image for a media contribution
mediaContributionRoute.patch('/:id/cover-image', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadImage.single('coverImage'), mediaContributionController.uploadCoverImage);

// Delete the cover image from a media contribution
mediaContributionRoute.delete('/:id/cover-image', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.deleteCoverImage);

// Update the author image for a media contribution
mediaContributionRoute.patch('/:id/author-image/:authorId', requireAuthenticated([Role.ADMIN]), validateObjectId, validateUuid('authorId'), uploadImage.single('authorImage'), mediaContributionController.uploadAuthorImage);

// Delete the author image from a media contribution
mediaContributionRoute.delete('/:id/author-image/:authorId', requireAuthenticated([Role.ADMIN]), validateObjectId, validateUuid('authorId'), mediaContributionController.deleteAuthorImage);

// Update the outlet image for a media contribution
mediaContributionRoute.patch('/:id/outlet-image', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadImage.single('outletImage'), mediaContributionController.uploadOutletImage);

// Delete the outlet image from a media contribution
mediaContributionRoute.delete('/:id/outlet-image', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.deleteOutletImage);

// Update the preview images for a media contribution
mediaContributionRoute.patch('/:id/preview-images', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadImage.array('previewImages', MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES), mediaContributionController.uploadPreviewImages);

// Delete a preview image for a media contribution
mediaContributionRoute.delete('/:id/preview-images/:previewImageId', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.deletePreviewImage);

// Reorder preview images for a media contribution
mediaContributionRoute.patch('/:id/preview-images/reorder', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(reorderPreviewImagesSchema), mediaContributionController.reorderPreviewImages);

// Upload a PDF file for a media contribution
mediaContributionRoute.patch('/:id/pdf-file', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadPdf.single('pdfFile'), mediaContributionController.uploadPdfFile);

// Delete the PDF file for a media contribution
mediaContributionRoute.delete('/:id/pdf-file', requireAuthenticated([Role.ADMIN]), validateObjectId, mediaContributionController.deletePdfFile);

// -------------------------- public --------------------------
// Fetch active localized media contributions (public)
mediaContributionRoute.get('/localized', mediaContributionController.getLocalizedMediaContributions);

// Fetch active localized media contribution by path (public)
mediaContributionRoute.get('/localized/:path', mediaContributionController.getLocalizedMediaContributionByPath);

export default mediaContributionRoute;