import express from 'express';
import * as contactController from '../controllers/contact-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';
import validateObjectId from '../middleware/validate-objectid';

const contactRoute = express.Router();

// Add a new contact message
contactRoute.post('/', contactController.createContactMessage);

// Fetch all contact messages
contactRoute.get('/', requireAuthenticated([Role.ADMIN]), contactController.getFullContactMessages);

// Mark read or unread of a contact message
contactRoute.patch('/:id/toggle/read', requireAuthenticated([Role.ADMIN]), validateObjectId, contactController.toggleIsReadInContactMessage);

// Delete a contact message
contactRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, contactController.deleteContactMessage);

export default contactRoute;