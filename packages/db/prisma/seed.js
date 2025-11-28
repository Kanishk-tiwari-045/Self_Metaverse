const { PrismaClient } = require('../src/generated/prisma/index.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting avatar seeding...');

  // Read the avatars JSON file
  const avatarsJsonPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'apps',
    'frontend',
    'public',
    'assets',
    'characters',
    'avatars.json'
  );

  if (!fs.existsSync(avatarsJsonPath)) {
    console.error('Avatars JSON file not found at:', avatarsJsonPath);
    return;
  }

  const avatarsJsonContent = fs.readFileSync(avatarsJsonPath, 'utf-8');
  const avatarsData = JSON.parse(avatarsJsonContent);

  // Find or create a system user to be the creator of avatars
  let systemUser = await prisma.user.findFirst({
    where: { username: 'system' },
  });

  if (!systemUser) {
    console.log('Creating system user for avatar creation...');
    systemUser = await prisma.user.create({
      data: {
        username: 'system',
        password: 'system_password_not_used',
        role: 'admin',
      },
    });
  }

  // Clear existing avatars (optional - remove this if you want to keep existing ones)
  console.log('Clearing existing avatars...');
  await prisma.avatar.deleteMany({
    where: {
      creatorId: systemUser.id,
    },
  });

  // Insert avatars from JSON
  const avatarsToCreate = [];

  for (const collection of avatarsData.avatars.collections) {
    console.log(`Processing collection: ${collection.name}`);

    for (const texture of collection.textures) {
      avatarsToCreate.push({
        name: texture.name,
        imageUrl: texture.url,
        creatorId: systemUser.id,
      });
    }
  }

  console.log(`Creating ${avatarsToCreate.length} avatars...`);

  for (const avatarData of avatarsToCreate) {
    try {
      await prisma.avatar.create({
        data: avatarData,
      });
      console.log(`✓ Created avatar: ${avatarData.name}`);
    } catch (error) {
      console.error(`✗ Failed to create avatar ${avatarData.name}:`, error);
    }
  }

  console.log('Avatar seeding completed!');

  // Display final count
  const totalAvatars = await prisma.avatar.count();
  console.log(`Total avatars in database: ${totalAvatars}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
