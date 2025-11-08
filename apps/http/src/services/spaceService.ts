import client from '@repo/db/client';
import {
  CreateSpaceSchema,
  AddElementSchema,
  DeleteElementSchema,
} from '../types';
import { z } from 'zod';

type CreateSpaceData = z.infer<typeof CreateSpaceSchema>;
type AddElementData = z.infer<typeof AddElementSchema>;
type DeleteElementData = z.infer<typeof DeleteElementSchema>;

export async function createSpace(userId: string, data: CreateSpaceData) {
  if (!data.mapId) {
    const space = await client.space.create({
      data: {
        name: data.name,
        width: parseInt(data.dimensions.split('x')[0]),
        height: parseInt(data.dimensions.split('x')[1]),
        ownerId: parseInt(userId),
      },
    });
    return { spaceId: space.id };
  }

  const map = await client.map.findFirst({
    where: {
      id: parseInt(data.mapId),
    },
    select: {
      mapElements: true,
      width: true,
      height: true,
    },
  });

  if (!map) {
    throw new Error('Map not found');
  }

  const space = await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        name: data.name,
        width: map.width,
        height: map.height,
        ownerId: parseInt(userId),
      },
    });

    await client.spaceElement.createMany({
      data: map.mapElements.map((e) => ({
        spaceId: space.id,
        elementId: e.elementId,
        x: e.x,
        y: e.y,
      })),
    });

    return space;
  });

  return { spaceId: space.id };
}

export async function deleteSpaceElement(userId: string, elementId: string) {
  const spaceElement = await client.spaceElement.findFirst({
    where: {
      id: parseInt(elementId),
    },
    include: {
      space: true,
    },
  });

  if (
    !spaceElement?.space.ownerId ||
    spaceElement.space.ownerId !== parseInt(userId)
  ) {
    throw new Error('Unauthorized');
  }

  await client.spaceElement.delete({
    where: {
      id: parseInt(elementId),
    },
  });

  return { message: 'Element deleted' };
}

export async function deleteSpace(userId: string, spaceId: string) {
  const space = await client.space.findUnique({
    where: {
      id: parseInt(spaceId),
    },
    select: {
      ownerId: true,
    },
  });

  if (!space) {
    throw new Error('Space not found');
  }

  if (space.ownerId !== parseInt(userId)) {
    throw new Error('Unauthorized');
  }

  await client.space.delete({
    where: {
      id: parseInt(spaceId),
    },
  });

  return { message: 'Space deleted' };
}

export async function getUserSpaces(userId: string) {
  const spaces = await client.space.findMany({
    where: {
      ownerId: parseInt(userId),
    },
  });

  return {
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail,
      dimensions: `${s.width}x${s.height}`,
      width: s.width,
      height: s.height,
    })),
  };
}

export async function getPublicSpaces(userId: string) {
  const spaces = await client.space.findMany({
    include: {
      owner: {
        select: {
          username: true,
        },
      },
    },
  });

  return {
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail,
      dimensions: `${s.width}x${s.height}`,
      width: s.width,
      height: s.height,
      owner: s.owner.username,
      isOwner: s.ownerId === parseInt(userId),
    })),
  };
}

export async function addElementToSpace(userId: string, data: AddElementData) {
  const space = await client.space.findUnique({
    where: {
      id: parseInt(data.spaceId),
      ownerId: parseInt(userId),
    },
    select: {
      width: true,
      height: true,
    },
  });

  if (!space) {
    throw new Error('Space not found');
  }

  if (
    data.x < 0 ||
    data.y < 0 ||
    data.x > space.width ||
    data.y > space.height
  ) {
    throw new Error('Point is outside of the boundary');
  }

  await client.spaceElement.create({
    data: {
      spaceId: parseInt(data.spaceId),
      elementId: parseInt(data.elementId),
      x: data.x,
      y: data.y,
    },
  });

  return { message: 'Element added' };
}

export async function getSpace(spaceId: string) {
  const space = await client.space.findUnique({
    where: {
      id: parseInt(spaceId),
    },
    include: {
      elements: {
        include: {
          element: true,
        },
      },
    },
  });

  if (!space) {
    throw new Error('Space not found');
  }

  return {
    id: space.id,
    name: space.name,
    width: space.width,
    height: space.height,
    ownerId: space.ownerId,
    elements: space.elements.map((e) => ({
      id: e.id,
      elementId: e.elementId,
      x: e.x,
      y: e.y,
      element: {
        id: e.element.id,
        imageUrl: e.element.imageUrl,
        width: e.element.width,
        height: e.element.height,
        isStatic: e.element.isStatic,
      },
    })),
  };
}
