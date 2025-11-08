import { Router } from 'express';
import client from '@repo/db/client';
import { hash } from '../../scrypt';
import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from '../../config';
import path from 'path';

export const avatarRouter = Router();

// Get all available avatars
avatarRouter.get('/', async (req, res) => {
  try {
    const avatars = await client.avatar.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    // Transform to match the frontend interface
    const avatarData = {
      avatars: {
        collections: [
          {
            name: 'Default Characters',
            position: 0,
            textures: avatars.map((avatar, index) => ({
              id: avatar.id.toString(),
              name: avatar.name,
              url: avatar.imageUrl,
              position: index,
              gender: avatar.name.toLowerCase().includes('female')
                ? 'female'
                : 'male',
            })),
          },
        ],
      },
    };

    res.json(avatarData);
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({ message: 'Failed to fetch avatars' });
  }
});

// Get user's selected avatar image
avatarRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await client.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.avatar) {
      return res.status(404).json({ message: 'User has no avatar selected' });
    }

    // Serve the avatar image file
    const imagePath = path.join(
      __dirname,
      '../../../frontend/public',
      user.avatar.imageUrl
    );
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({ message: 'Failed to fetch user avatar' });
  }
});

// Update user avatar
avatarRouter.put('/user', async (req, res) => {
  try {
    console.log('PUT /user request body:', req.body);
    const { userId, avatarId } = req.body;
    console.log(
      'userId:',
      userId,
      'type:',
      typeof userId,
      'avatarId:',
      avatarId,
      'type:',
      typeof avatarId
    );

    // Use default values for testing
    const finalUserId = userId || 1;
    const finalAvatarId = avatarId || '1';

    const userIdNum = parseInt(finalUserId);
    const avatarIdNum = parseInt(finalAvatarId);

    if (isNaN(userIdNum) || isNaN(avatarIdNum)) {
      return res.status(400).json({
        message: 'Invalid userId or avatarId format',
        received: { userId, avatarId, finalUserId, finalAvatarId },
      });
    }

    console.log('Using userId:', userIdNum, 'avatarId:', avatarIdNum);

    // Verify avatar exists
    const avatar = await client.avatar.findUnique({
      where: { id: avatarIdNum },
    });

    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Update user avatar
    const updatedUser = await client.user.update({
      where: { id: userIdNum },
      data: { avatarId: avatarIdNum },
      include: {
        avatar: true,
      },
    });

    // Generate new token with updated avatar info
    const token = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role },
      JWT_PASSWORD
    );

    res.json({
      token,
      user: {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        role: updatedUser.role,
        avatar: updatedUser.avatar
          ? {
              id: updatedUser.avatar.id.toString(),
              name: updatedUser.avatar.name,
              imageUrl: updatedUser.avatar.imageUrl,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error updating user avatar:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Create default avatars if they don't exist
avatarRouter.post('/seed', async (req, res) => {
  try {
    // Check if avatars already exist
    const existingAvatars = await client.avatar.count();

    if (existingAvatars > 0) {
      return res.json({ message: 'Avatars already exist' });
    }

    // Create default avatars
    const defaultAvatars = [
      { name: 'Male 1', imageUrl: '/assets/characters/Male 01-1.png' },
      { name: 'Male 2', imageUrl: '/assets/characters/Male 02-2.png' },
      { name: 'Male 3', imageUrl: '/assets/characters/Male 03-4.png' },
      { name: 'Male 4', imageUrl: '/assets/characters/Male 09-1.png' },
      { name: 'Female 1', imageUrl: '/assets/characters/Female 01-1.png' },
      { name: 'Female 2', imageUrl: '/assets/characters/Female 02-2.png' },
      { name: 'Female 3', imageUrl: '/assets/characters/Female 03-3.png' },
      { name: 'Female 4', imageUrl: '/assets/characters/Female 04-4.png' },
    ];

    // Create a default creator (admin user)
    let adminUser = await client.user.findFirst({
      where: { role: 'admin' },
    });

    if (!adminUser) {
      // Create admin user if doesn't exist
      const hashedPassword = await hash('admin123');

      adminUser = await client.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        },
      });
    }

    const createdAvatars = await Promise.all(
      defaultAvatars.map((avatar) =>
        client.avatar.create({
          data: {
            name: avatar.name,
            imageUrl: avatar.imageUrl,
            creatorId: adminUser!.id,
          },
        })
      )
    );

    res.json({
      message: 'Default avatars created successfully',
      avatars: createdAvatars,
    });
  } catch (error) {
    console.error('Error seeding avatars:', error);
    res.status(500).json({ message: 'Failed to seed avatars' });
  }
});
