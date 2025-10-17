// src/server.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import modelRoutes from './routes/model';

// Load environment variables.
// Use `.env.prod` for production and `.env` for development (these files exist in the repo).
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.prod' });
  console.log('Loaded environment from .env.prod');
} else {
  // default development file in this repo is `.env`
  dotenv.config({ path: '.env' });
  console.log('Loaded environment from .env');
}

const app = express();

// middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Allow credentials and an exact list of allowed origins (no trailing slashes)
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'https://authenti-text.vercel.app/')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or same-origin
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
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
// temporary alias to support clients calling "/auth" without the "/api" prefix
app.use('/auth', authRoutes);

// model routes
app.use('/api/model', modelRoutes);

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
};

start();
