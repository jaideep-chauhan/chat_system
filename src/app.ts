import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middlewares/errorHandler';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/chat', chatRoutes);
app.use('/user', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
