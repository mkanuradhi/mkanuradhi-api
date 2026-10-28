import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import contactRoute from './routes/contact-route';
import blogPostRoute from './routes/blog-post-route';
import courseRoute from './routes/course-route';
import quizRoute from './routes/quiz-route';
import publicationRoute from './routes/publication-route';
import researchRoute from './routes/research-route';
import awardRoute from './routes/award-route';
import bookRoute from './routes/book-route';
import mediaContributionRoute from './routes/media-contribution-route';
import logger from './config/logger-config';
import limiter from './config/rate-limit-config';
import RequestLogger from './middleware/request-logger';
import notFoundHandler from './middleware/not-found-handler';
import errorHandler from './middleware/error-handler';
import homeRoute from './routes/home-route';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express'
import { getCacheStrategy } from './cache/cache-factory';
import statRoute from './routes/stat-route';

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
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(limiter);
app.use(RequestLogger);
app.use(express.json());

app.use(clerkMiddleware());

app.use('/', homeRoute);
app.use('/contact', contactRoute);
app.use('/blog-posts', blogPostRoute);
app.use('/courses', courseRoute);
app.use('/quizzes', quizRoute);
app.use('/publications', publicationRoute);
app.use('/research', researchRoute);
app.use('/awards', awardRoute);
app.use('/books', bookRoute);
app.use('/media-contributions', mediaContributionRoute);
app.use('/stats', statRoute);

// handling errors
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Connecting to database...');
    const conn = await mongoose.connect(mongoUri);
    logger.info(`Connected host: ${conn.connection.host} on port: ${conn.connection.port} to database: ${conn.connection.name}`);

    logger.info('Initializing cache strategy...');
    getCacheStrategy();
    logger.info(`Cache strategy ready: ${process.env.CACHE_STRATEGY ?? 'memory'}`);

    const server = app.listen(port, () => {
      logger.info(`App is running on port ${port}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async (err) => {
        if (err) {
          logger.error(`Error closing HTTP server: ${err}`);
        }

        try {
          await getCacheStrategy().close();
          logger.info('Cache connection closed');
        } catch (cacheErr) {
          logger.error(`Error closing cache: ${cacheErr}`);
        }

        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (dbErr) {
          logger.error(`Error closing MongoDB connection: ${dbErr}`);
        }

        process.exit(0);
      });

      // Safety net: force-exit if something hangs (e.g. a stuck connection)
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C in local dev
  } catch (error) {
    logger.error(`Error connecting with db ${error}`);
    process.exit(1);
  }
}

startServer();

export default app;
