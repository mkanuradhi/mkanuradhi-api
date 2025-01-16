import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import emailRoute from './routes/email-route';
import blogPostRoute from './routes/blog-post-route';
import logger from './config/logger-config';
import limiter from './config/rate-limit-config';
import RequestLogger from './middleware/request-logger';
import notFoundHandler from './middleware/not-found-handler';
import errorHandler from './middleware/error-handler';
import homeRoute from './routes/home-route';
import mongoose from 'mongoose';

const validateEnvVariables = (): void => {
  const requiredEnvVars = ["PORT", "DB_URI"];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1);
  }
};

validateEnvVariables();
const app = express();
const port: number = parseInt(process.env.PORT || '3010', 10);
const mongoUri: string = process.env.DB_URI || '';

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
app.use('/blog-posts', blogPostRoute);

// handling errors
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Connecting to database...');
    const conn = await mongoose.connect(mongoUri);
    logger.info(`Connected host: ${conn.connection.host} on port: ${conn.connection.port} to database: ${conn.connection.name}`);

    app.listen(port, () => {
      logger.info(`App is running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Error connecting with db ${error}`);
    process.exit(1);
  }
}

startServer();

export default app;
