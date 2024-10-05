import express from 'express';
import * as homeController from '../controllers/home-controller';

const homeRoute = express.Router();

homeRoute.all('/', homeController.init);

export default homeRoute;