import express from 'express';
import * as emailController from '../controllers/email-controller';

const emailRoute = express.Router();

emailRoute.post('/notify', emailController.notifyMessage);

export default emailRoute;