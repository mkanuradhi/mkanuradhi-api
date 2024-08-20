import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';

const PORT: number = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world! welcome to my app');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
