import { Router } from 'express';
import { signup, signin } from '../../services/authService';

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  try {
    console.log('inside signup');
    console.log(
      'Environment check - DATABASE_URL exists:',
      !!process.env.DATABASE_URL
    );

    const result = await signup(req.body);
    res.json(result);
  } catch (error) {
    console.log('Signup error:', error);

    if (error instanceof Error) {
      if (error.message === 'Validation failed') {
        res.status(400).json({ message: 'Validation failed' });
        return;
      }
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        res.status(400).json({ message: 'Username already exists' });
        return;
      }
      if (error.code === 'P1001') {
        res.status(500).json({ message: 'Database connection failed' });
        return;
      }
      res.status(500).json({ message: 'Database error', code: error.code });
      return;
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

authRouter.post('/signin', async (req, res) => {
  try {
    const result = await signin(req.body);
    res.json(result);
  } catch (error) {
    console.log('Signin error:', error);

    if (error instanceof Error) {
      if (error.message === 'Validation failed') {
        res.status(403).json({ message: 'Validation failed' });
        return;
      }
      if (
        error.message === 'User not found' ||
        error.message === 'Invalid password'
      ) {
        res.status(403).json({ message: 'Invalid credentials' });
        return;
      }
    }

    res.status(400).json({ message: 'Internal server error' });
  }
});
