import { Router } from 'express';
import { userRouter } from './user';
import { spaceRouter } from './space';
import { adminRouter } from './admin';
import { authRouter } from './auth';
import { mapsRouter } from './maps';
import { avatarRouter } from './avatar';
import client from '@repo/db/client';

export const router = Router();

// Database health check endpoint
router.get('/health', async (req, res) => {
  try {
    console.log('Testing database connection...');
    await client.$connect();
    console.log('Database connection successful');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res
      .status(500)
      .json({ status: 'error', database: 'disconnected', error: errorMessage });
  }
});

router.use('/auth', authRouter);
router.use('/maps', mapsRouter);
router.use('/avatars', avatarRouter);

router.use('/user', userRouter);
router.use('/space', spaceRouter);
router.use('/admin', adminRouter);
