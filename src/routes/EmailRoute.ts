import express from 'express';
import * as emailController from '../controllers/EmailController';

const emailRoute = express.Router();

emailRoute.post('/notify', emailController.notifyMessage);

export default emailRoute;