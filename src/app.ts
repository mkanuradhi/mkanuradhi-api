import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express, { Request, Response } from 'express';
import emailRoute from './routes/EmailRoute';
import logger from './config/Logger';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  credentials: true
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/email', emailRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world! welcome to my app');
});

app.listen(PORT, () => {
  logger.info(`App is running on port ${PORT}`);
});

export default app;
