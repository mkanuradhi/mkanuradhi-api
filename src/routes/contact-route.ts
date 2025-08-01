import express from 'express';
import * as contactController from '../controllers/contact-controller';

const emailRoute = express.Router();

// Add a new contact message
emailRoute.post('/', contactController.createContactMessage);

export default emailRoute;