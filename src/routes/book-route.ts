import express from 'express';
import * as bookController from '../controllers/book-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';
import { validate } from '../middleware/validate-middleware';
import { activationBookSchema, createBookSchema, MAX_BOOK_PREVIEW_IMAGES, updateBookSchema } from '../validators/book-validator';
import { uploadImage } from '../middleware/file-upload';

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
bookRoute.put('/:id', requireAuthenticated([Role.ADMIN]), validate(updateBookSchema), bookController.updateBook);

// Delete an book
bookRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deleteBook);

// Activate or deactivate an book
bookRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, validate(activationBookSchema), bookController.toggleBookActivation);

// Update the cover image for a book
bookRoute.patch('/:id/cover-image', requireAuthenticated([Role.ADMIN]), uploadImage.single('coverImage'), bookController.uploadCoverImage);

// Update the preview images for a book
bookRoute.patch('/:id/preview-images', requireAuthenticated([Role.ADMIN]), uploadImage.array('images', MAX_BOOK_PREVIEW_IMAGES), bookController.uploadPreviewImages);

export default bookRoute;
