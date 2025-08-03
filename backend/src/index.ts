import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import contentSourceRoutes from './routes/contentSources';
import discoveredContentRoutes from './routes/discoveredContent';
import socialAccountRoutes from './routes/socialAccounts';
import generatedPostRoutes from './routes/generatedPosts';
import analyticsRoutes from './routes/analytics';

import { errorHandler } from './middleware/errorHandler';
import { startCronJobs } from './services/cronService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

export const prisma = new PrismaClient();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/content-sources', contentSourceRoutes);
app.use('/api/discovered-content', discoveredContentRoutes);
app.use('/api/social-accounts', socialAccountRoutes);
app.use('/api/generated-posts', generatedPostRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  
  if (process.env.NODE_ENV === 'production') {
    startCronJobs();
    console.log('⏰ Cron jobs started');
  }
});

process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('⭐ Process terminated');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('⭐ Process terminated');
  });
  await prisma.$disconnect();
});

export default app;