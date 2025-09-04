import express from 'express';
import * as awardController from '../controllers/award-controller';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const awardRoute = express.Router();

// Add a new award (en text data)
awardRoute.post('/', awardController.createAwardEn);

export default awardRoute;
