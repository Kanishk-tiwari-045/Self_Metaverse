import { Router } from 'express';
import { userMiddleware } from '../../middleware/user';
import {
  AddElementSchema,
  CreateElementSchema,
  CreateSpaceSchema,
  DeleteElementSchema,
} from '../../types';
import {
  createSpace,
  deleteSpaceElement,
  deleteSpace,
  getUserSpaces,
  getPublicSpaces,
  addElementToSpace,
  getSpace,
} from '../../services/spaceService';

export const spaceRouter = Router();

spaceRouter.post('/', userMiddleware, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: 'Validation failed' });
    return;
  }

  try {
    const result = await createSpace(req.userId!, parsedData.data);
    res.json(result);
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

spaceRouter.delete('/element', userMiddleware, async (req, res) => {
  const parsedData = DeleteElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: 'Validation failed' });
    return;
  }

  try {
    const result = await deleteSpaceElement(req.userId!, parsedData.data.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting space element:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      res.status(403).json({ message: 'Unauthorized' });
    } else {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
});

spaceRouter.delete('/:spaceId', userMiddleware, async (req, res) => {
  try {
    const result = await deleteSpace(req.userId!, req.params.spaceId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting space:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      res.status(403).json({ message: 'Unauthorized' });
    } else {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
});

spaceRouter.get('/all', userMiddleware, async (req, res) => {
  try {
    const result = await getUserSpaces(req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Error getting user spaces:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

spaceRouter.get('/public', userMiddleware, async (req, res) => {
  try {
    const result = await getPublicSpaces(req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Error getting public spaces:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

spaceRouter.post('/element', userMiddleware, async (req, res) => {
  const parsedData = AddElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: 'Validation failed' });
    return;
  }

  try {
    const result = await addElementToSpace(req.userId!, parsedData.data);
    res.json(result);
  } catch (error) {
    console.error('Error adding element to space:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

spaceRouter.get('/:spaceId', userMiddleware, async (req, res) => {
  try {
    const result = await getSpace(req.params.spaceId);
    res.json(result);
  } catch (error) {
    console.error('Error getting space:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});
