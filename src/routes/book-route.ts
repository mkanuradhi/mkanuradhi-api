import express from 'express';
import * as bookController from '../controllers/book-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';
import { validate } from '../middleware/validate-middleware';
import { activationBookSchema, createBookSchema, MAX_BOOK_PREVIEW_IMAGES, reorderPreviewImagesSchema, updateBookSchema } from '../validators/book-validator';
import { uploadImage, uploadPdf } from '../middleware/file-upload';
import validateUuid from '../middleware/validate-uuid';

const bookRoute = express.Router();

// Fetch active localized book by path (public)
bookRoute.get('/localized/:path', bookController.getLocalizedBookByPath);

// Fetch active localized books (public)
bookRoute.get('/localized', bookController.getLocalizedBooks);

// Fetch all books
bookRoute.get('/', requireAuthenticated([Role.ADMIN]), bookController.getBooks);

// Add a new book
bookRoute.post('/', requireAuthenticated([Role.ADMIN]), validate(createBookSchema), bookController.createBook);

// Fetch a specific book by ID
bookRoute.get('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.getBook);

// Update book data
bookRoute.put('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(updateBookSchema), bookController.updateBook);

// Delete an book
bookRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deleteBook);

// Activate or deactivate an book
bookRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(activationBookSchema), bookController.toggleBookActivation);

// Update the cover image for a book
bookRoute.patch('/:id/cover-image', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadImage.single('coverImage'), bookController.uploadCoverImage);

// Delete the cover image from a book
bookRoute.delete('/:id/cover-image', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deleteCoverImage);

// Update the author image for a book
bookRoute.patch('/:id/author-image/:authorId', requireAuthenticated([Role.ADMIN]), validateObjectId, validateUuid('authorId'), uploadImage.single('authorImage'), bookController.uploadAuthorImage);

// Update the preview images for a book
bookRoute.patch('/:id/preview-images', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadImage.array('previewImages', MAX_BOOK_PREVIEW_IMAGES), bookController.uploadPreviewImages);

// Delete a preview image for a book
bookRoute.delete('/:id/preview-images/:previewImageId', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deletePreviewImage);

// Reorder preview images for a book
bookRoute.patch('/:id/preview-images/reorder', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(reorderPreviewImagesSchema), bookController.reorderPreviewImages);

// Upload a PDF teaser for a book
bookRoute.patch('/:id/pdf-teaser', requireAuthenticated([Role.ADMIN]), validateObjectId, uploadPdf.single('pdfTeaser'), bookController.uploadPdfTeaser);

// Delete the PDF teaser for a book
bookRoute.delete('/:id/pdf-teaser', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deletePdfTeaser);

export default bookRoute;
