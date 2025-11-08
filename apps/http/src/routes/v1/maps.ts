import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from '../../config';
import {
  getElements,
  getAvatars,
  getPublicMaps,
  getMapDetails,
  getTemplates,
  getMapByCode,
  getMapForEdit,
} from '../../services/mapService';

export const mapsRouter = Router();

// Get all elements
mapsRouter.get('/elements', async (req, res) => {
  try {
    const result = await getElements();
    res.json(result);
  } catch (error) {
    console.error('Failed to get elements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all avatars
mapsRouter.get('/avatars', async (req, res) => {
  try {
    const result = await getAvatars();
    res.json(result);
  } catch (error) {
    console.error('Failed to get avatars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get public maps
mapsRouter.get('/maps', async (req, res) => {
  try {
    const result = await getPublicMaps();
    res.json(result);
  } catch (error) {
    console.error('Failed to get maps:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get map details (public view)
mapsRouter.get('/map/:mapId', async (req, res) => {
  try {
    const mapId = parseInt(req.params.mapId);
    const result = await getMapDetails(mapId);
    res.json(result);
  } catch (error) {
    console.error('Failed to get map details:', error);
    if (error instanceof Error && error.message === 'Map not found') {
      res.status(404).json({ message: 'Map not found' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Get map templates
mapsRouter.get('/templates', async (req, res) => {
  try {
    const result = await getTemplates();
    res.json(result);
  } catch (error) {
    console.error('Failed to get templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get map by access code
mapsRouter.get('/map/code/:accessCode', async (req, res) => {
  try {
    const result = await getMapByCode(req.params.accessCode);
    res.json(result);
  } catch (error) {
    console.error('Failed to get map by code:', error);
    if (error instanceof Error && error.message === 'Map not found') {
      res.status(404).json({ message: 'Map not found' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Get map details for editing (requires auth)
mapsRouter.get('/map/:mapId/edit', async (req, res) => {
  try {
    // Extract user info from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, JWT_PASSWORD) as any;
    const userId = decoded.userId;
    const mapId = parseInt(req.params.mapId);

    const result = await getMapForEdit(mapId, userId);
    res.json(result);
  } catch (error) {
    console.error('Failed to get map for editing:', error);
    if (
      error instanceof Error &&
      error.message === 'Map not found or access denied'
    ) {
      res.status(404).json({ message: 'Map not found or access denied' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});
