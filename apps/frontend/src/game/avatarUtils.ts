import Phaser from 'phaser';

export function createAvatarTexture(
  scene: Phaser.Scene,
  key: string,
  color: number
): void {
  // Create graphics object to draw avatar
  const graphics = scene.add.graphics();

  // Draw main body (larger circle)
  graphics.fillStyle(color);
  graphics.fillCircle(16, 16, 14); // Centered circle with radius 14

  // Add border for visibility
  graphics.lineStyle(2, 0x000000);
  graphics.strokeCircle(16, 16, 14);

  // Add a simple face with larger features for visibility
  graphics.fillStyle(0x000000);
  graphics.fillCircle(10, 12, 2); // Left eye
  graphics.fillCircle(22, 12, 2); // Right eye
  graphics.fillEllipse(16, 20, 8, 4); // Mouth

  // Generate texture and clean up
  graphics.generateTexture(key, 32, 32);
  graphics.destroy();

  console.log(
    `Avatar texture '${key}' created with color:`,
    color.toString(16)
  );
}

export function getAvatarKey(userId: string | number): string {
  // Convert to string if it's a number
  const idString = String(userId);
  // Use user ID to consistently assign the same avatar to the same user
  const hash = idString.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  const avatarIndex = Math.abs(hash) % 8; // 8 different avatars
  return `avatar_${avatarIndex}`;
}

export const AVATAR_COLORS = [
  0xff6b6b, // Red
  0x4ecdc4, // Teal
  0x45b7d1, // Blue
  0xf9ca24, // Yellow
  0xf0932b, // Orange
  0xeb4d4b, // Pink
  0x6c5ce7, // Purple
  0xa29bfe, // Light Purple
];
