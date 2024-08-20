import express, { Request, Response } from 'express';

const PORT = 3000;

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world! welcome to my app');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
