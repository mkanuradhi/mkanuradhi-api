import express from 'express';
import * as contactController from '../controllers/contact-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const contactRoute = express.Router();

// Add a new contact message
contactRoute.post('/', contactController.createContactMessage);

// Fetch all contact messages
contactRoute.get('/', requireAuthenticated([Role.ADMIN]), contactController.getFullContactMessages);

export default contactRoute;