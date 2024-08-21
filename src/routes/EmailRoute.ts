import express from 'express';
import * as emailController from '../controllers/EmailController';

const emailRoute = express.Router();

emailRoute.post('/', emailController.sendEmail);

export default emailRoute;