import express from 'express';
import * as bookController from '../controllers/book-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';
import { validate } from '../middleware/validate-middleware';
import { activationBookSchema, createBookSchema, updateBookSchema } from '../validators/book-validator';

const bookRoute = express.Router();

// Fetch all books
bookRoute.get('/', bookController.getBooks);

// Add a new book
bookRoute.post('/', validate(createBookSchema), bookController.createBook);

// Fetch a specific book by ID
bookRoute.get('/:id', validateObjectId, bookController.getBook);

// Update book data
bookRoute.put('/:id', validate(updateBookSchema), bookController.updateBook);

// Fetch a specific book by path
bookRoute.get('/path/:path', bookController.getBookByPath);

// Delete an book
bookRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, bookController.deleteBook);

// Activate or deactivate an book
bookRoute.patch('/:id/toggle', validateObjectId, validate(activationBookSchema), bookController.toggleBookActivation);

export default bookRoute;
