import { Router } from 'express';
import { userMiddleware } from '../../middleware/user';
import {
  updateUserMetadata,
  getBulkMetadata,
  getJoinedMaps,
  recordMapVisit,
  getOwnedMaps,
  copyTemplate,
  createMapFromSpace,
  addElementToMap,
  removeElementFromMap,
  addSpaceToMap,
  removeSpaceFromMap,
  getUserProfile,
  updateUserPassword,
  updateAvatarInfo,
  deleteUserAccount,
} from '../../services/userService';

export const userRouter = Router();

userRouter.post('/metadata', userMiddleware, async (req, res) => {
  try {
    const result = await updateUserMetadata(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.log('Update metadata error:', error);
    if (error instanceof Error && error.message === 'Validation failed') {
      res.status(400).json({ message: 'Validation failed' });
      return;
    }
    res.status(400).json({ message: 'Internal server error' });
  }
});

userRouter.get('/metadata/bulk', async (req, res) => {
  try {
    const userIdString = (req.query.ids ?? '[]') as string;
    const userIds = userIdString
      .slice(1, userIdString?.length - 1)
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    const result = await getBulkMetadata(userIds);
    res.json(result);
  } catch (error) {
    console.error('Bulk metadata error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get maps that user has recently joined
userRouter.get('/joined-maps', userMiddleware, async (req, res) => {
  try {
    const result = await getJoinedMaps(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch joined maps:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Record map visit (called when user joins a map)
userRouter.post('/visit-map', userMiddleware, async (req, res) => {
  try {
    const result = await recordMapVisit(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Failed to record map visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get maps owned by user (for regular users who can create maps)
userRouter.get('/owned-maps', userMiddleware, async (req, res) => {
  try {
    const result = await getOwnedMaps(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch owned maps:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a complete copy of a template map (deep copy)
userRouter.post('/copy-template', userMiddleware, async (req, res) => {
  try {
    console.log(
      `User ${req.userId} is copying template ${req.body.templateId}`
    );
    const result = await copyTemplate(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Failed to copy template:', error);
    if (error instanceof Error && error.message === 'Template not found') {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a shareable map from a space (generates access code)
userRouter.post('/create-map', userMiddleware, async (req, res) => {
  try {
    const result = await createMapFromSpace(parseInt(req.userId!), req.body);
    res.json(result);
  } catch (error) {
    console.error('Failed to create map:', error);
    if (
      error instanceof Error &&
      error.message === 'Space not found or access denied'
    ) {
      res.status(404).json({ message: 'Space not found or access denied' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add element to user's own map
userRouter.post('/map/:mapId/element', userMiddleware, async (req, res) => {
  try {
    const mapId = parseInt(req.params.mapId);
    const result = await addElementToMap(
      parseInt(req.userId!),
      mapId,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to add element to map:', error);
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

// Remove element from user's own map
userRouter.delete('/map/:mapId/element', userMiddleware, async (req, res) => {
  try {
    const mapId = parseInt(req.params.mapId);
    const result = await removeElementFromMap(
      parseInt(req.userId!),
      mapId,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to remove element from map:', error);
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

// Add space to user's own map
userRouter.post('/map/:mapId/space', userMiddleware, async (req, res) => {
  try {
    const mapId = parseInt(req.params.mapId);
    const result = await addSpaceToMap(parseInt(req.userId!), mapId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Failed to add space to map:', error);
    if (error instanceof Error) {
      if (error.message === 'Map not found or access denied') {
        res.status(404).json({ message: 'Map not found or access denied' });
        return;
      }
      if (error.message === 'Space not found') {
        res.status(404).json({ message: 'Space not found' });
        return;
      }
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove space from user's own map
userRouter.delete('/map/:mapId/space', userMiddleware, async (req, res) => {
  try {
    const mapId = parseInt(req.params.mapId);
    const result = await removeSpaceFromMap(
      parseInt(req.userId!),
      mapId,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to remove space from map:', error);
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

// Get user profile
userRouter.get('/profile', userMiddleware, async (req, res) => {
  try {
    const result = await getUserProfile(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user password
userRouter.put('/password', userMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: 'Current and new password are required' });
      return;
    }
    const result = await updateUserPassword(
      parseInt(req.userId!),
      currentPassword,
      newPassword
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to update password:', error);
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      if (error.message === 'Current password is incorrect') {
        res.status(401).json({ message: 'Current password is incorrect' });
        return;
      }
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update avatar info
userRouter.put('/avatar-info', userMiddleware, async (req, res) => {
  try {
    const { avatarId, avatarName } = req.body;
    const result = await updateAvatarInfo(
      parseInt(req.userId!),
      avatarId,
      avatarName
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to update avatar info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user account
userRouter.delete('/account', userMiddleware, async (req, res) => {
  try {
    const result = await deleteUserAccount(parseInt(req.userId!));
    res.json(result);
  } catch (error) {
    console.error('Failed to delete account:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});
