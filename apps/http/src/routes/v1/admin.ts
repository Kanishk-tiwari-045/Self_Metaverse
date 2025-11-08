import { Router } from 'express';
import { adminMiddleware } from '../../middleware/admin';
import {
  createElement,
  updateElement,
  createAvatar,
  createMap,
  getAdminElements,
  getAdminAvatars,
  getAdminMaps,
  getAdminMapDetails,
  addElementToAdminMap,
  removeElementFromAdminMap,
  addSpaceToAdminMap,
  removeSpaceFromAdminMap,
} from '../../services/adminService';

export const adminRouter = Router();
adminRouter.use(adminMiddleware);

adminRouter.post('/element', async (req, res) => {
  try {
    const result = await createElement(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Create element error:', error);
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

adminRouter.put('/element/:elementId', async (req, res) => {
  try {
    const result = await updateElement(
      parseInt(req.userId!),
      parseInt(req.params.elementId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Update element error:', error);
    if (
      error instanceof Error &&
      error.message === 'Element not found or access denied'
    ) {
      res.status(404).json({ message: 'Element not found or access denied' });
      return;
    }
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

adminRouter.post('/avatar', async (req, res) => {
  try {
    const result = await createAvatar(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Create avatar error:', error);
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

adminRouter.post('/map', async (req, res) => {
  try {
    const result = await createMap(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Create map error:', error);
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get elements created by current admin
adminRouter.get('/elements', async (req, res) => {
  try {
    const result = await getAdminElements(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Get admin elements error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get avatars created by current admin
adminRouter.get('/avatars', async (req, res) => {
  try {
    const result = await getAdminAvatars(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Get admin avatars error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get maps created by current admin
adminRouter.get('/maps', async (req, res) => {
  try {
    const result = await getAdminMaps(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Get admin maps error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific map details with elements
adminRouter.get('/map/:mapId', async (req, res) => {
  try {
    const result = await getAdminMapDetails(
      parseInt(req.userId!),
      parseInt(req.params.mapId)
    );
    res.json(result);
  } catch (error) {
    console.error('Get admin map details error:', error);
    if (
      error instanceof Error &&
      error.message === 'Map not found or access denied'
    ) {
      res.status(404).json({ message: 'Map not found or access denied' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add element to map
adminRouter.post('/map/:mapId/element', async (req, res) => {
  try {
    const result = await addElementToAdminMap(
      parseInt(req.userId!),
      parseInt(req.params.mapId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Add element to admin map error:', error);
    if (
      error instanceof Error &&
      error.message === 'Map not found or access denied'
    ) {
      res.status(404).json({ message: 'Map not found or access denied' });
      return;
    }
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove element from map
adminRouter.delete('/map/:mapId/element', async (req, res) => {
  try {
    const result = await removeElementFromAdminMap(
      parseInt(req.userId!),
      parseInt(req.params.mapId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Remove element from admin map error:', error);
    if (
      error instanceof Error &&
      error.message === 'Map not found or access denied'
    ) {
      res.status(404).json({ message: 'Map not found or access denied' });
      return;
    }
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add space to map
adminRouter.post('/map/:mapId/space', async (req, res) => {
  try {
    const result = await addSpaceToAdminMap(
      parseInt(req.userId!),
      parseInt(req.params.mapId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Add space to admin map error:', error);
    if (error instanceof Error) {
      if (error.message === 'Map not found or access denied') {
        res.status(404).json({ message: 'Map not found or access denied' });
        return;
      }
      if (error.message === 'Space not found') {
        res.status(404).json({ message: 'Space not found' });
        return;
      }
      if (error.message === "Space doesn't fit within map bounds") {
        res
          .status(400)
          .json({ message: "Space doesn't fit within map bounds" });
        return;
      }
      if (
        error.message === 'Space collides with existing element' ||
        error.message === 'Space collides with existing space'
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message === 'Validation failed') {
        res.status(400).json({ message: 'Validation failed' });
        return;
      }
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove space from map
adminRouter.delete('/map/:mapId/space', async (req, res) => {
  try {
    const result = await removeSpaceFromAdminMap(
      parseInt(req.userId!),
      parseInt(req.params.mapId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Remove space from admin map error:', error);
    if (
      error instanceof Error &&
      error.message === 'Map not found or access denied'
    ) {
      res.status(404).json({ message: 'Map not found or access denied' });
      return;
    }
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});
