// src/server.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();

// middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // allow cookies
  })
);

// limit brute-force
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  })
);

// routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

start();
