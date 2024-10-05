import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import emailRoute from './routes/EmailRoute';
import logger from './config/Logger';
import limiter from './config/RateLimit';
import RequestLogger from './middleware/RequestLogger';
import notFoundHandler from './middleware/not-found-handler';
import errorHandler from './middleware/error-handler';
import homeRoute from './routes/home-route';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3010', 10);

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  credentials: true
}

app.use(cors(corsOptions));
app.use(limiter);
app.use(RequestLogger);
app.use(express.json());

app.use('/', homeRoute);
app.use('/email', emailRoute);

// handling errors
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`App is running on port ${PORT}`);
});

export default app;
