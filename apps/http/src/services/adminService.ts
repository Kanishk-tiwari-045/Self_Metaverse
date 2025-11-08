import client from '@repo/db/client';
import {
  CreateElementSchema,
  UpdateElementSchema,
  CreateAvatarSchema,
  CreateMapSchema,
  AddMapElementSchema,
  AddMapSpaceSchema,
  DeleteElementSchema,
} from '../types';

export interface CreateElementData {
  imageUrl: string;
  width: number;
  height: number;
  static: boolean;
}

export interface UpdateElementData {
  imageUrl: string;
}

export interface CreateAvatarData {
  name: string;
  imageUrl: string;
}

export interface CreateMapData {
  thumbnail?: string;
  dimensions: string;
  name: string;
  defaultElements: Array<{
    elementId: string;
    x: number;
    y: number;
  }>;
  isTemplate?: boolean;
  accessCode?: string;
}

export interface MapElementData {
  elementId: string;
  x: number;
  y: number;
}

export interface MapSpaceData {
  spaceId: string;
  x: number;
  y: number;
}

export interface DeleteElementData {
  id: string;
}

export async function createElement(userId: number, data: CreateElementData) {
  const parsedData = CreateElementSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  const element = await client.element.create({
    data: {
      width: parsedData.data.width,
      height: parsedData.data.height,
      isStatic: parsedData.data.static,
      imageUrl: parsedData.data.imageUrl,
      creatorId: userId,
    },
  });

  return { id: element.id };
}

export async function updateElement(
  userId: number,
  elementId: number,
  data: UpdateElementData
) {
  const parsedData = UpdateElementSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if the element belongs to the current admin
  const element = await client.element.findFirst({
    where: {
      id: elementId,
      creatorId: userId,
    },
  });

  if (!element) {
    throw new Error('Element not found or access denied');
  }

  await client.element.update({
    where: { id: elementId },
    data: { imageUrl: parsedData.data.imageUrl },
  });

  return { message: 'Element updated' };
}

export async function createAvatar(userId: number, data: CreateAvatarData) {
  const parsedData = CreateAvatarSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  const avatar = await client.avatar.create({
    data: {
      name: parsedData.data.name,
      imageUrl: parsedData.data.imageUrl,
      creatorId: userId,
    },
  });

  return { avatarId: avatar.id };
}

export async function createMap(userId: number, data: CreateMapData) {
  const parsedData = CreateMapSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if this should be a template or a regular map
  const isTemplate = data.isTemplate === true;

  const mapData: any = {
    name: parsedData.data.name,
    width: parseInt(parsedData.data.dimensions.split('x')[0]),
    height: parseInt(parsedData.data.dimensions.split('x')[1]),
    creatorId: userId,
    isTemplate: isTemplate,
    mapElements: {
      create: parsedData.data.defaultElements.map((e) => ({
        elementId: parseInt(e.elementId),
        x: e.x,
        y: e.y,
      })),
    },
  };

  // Only add accessCode if it's not a template
  if (!isTemplate && data.accessCode) {
    mapData.accessCode = data.accessCode;
  }

  const map = await client.map.create({ data: mapData });
  return { id: map.id };
}

export async function getAdminElements(userId: number) {
  const elements = await client.element.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      width: true,
      height: true,
      imageUrl: true,
      isStatic: true,
    },
  });

  return elements;
}

export async function getAdminAvatars(userId: number) {
  const avatars = await client.avatar.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  return avatars;
}

export async function getAdminMaps(userId: number) {
  const maps = await client.map.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      name: true,
      width: true,
      height: true,
      accessCode: true,
      isTemplate: true,
    },
  });

  return {
    maps: maps.map((m) => ({
      id: m.id,
      name: m.name,
      width: m.width,
      height: m.height,
      accessCode: m.accessCode,
      isTemplate: m.isTemplate,
    })),
  };
}

export async function getAdminMapDetails(userId: number, mapId: number) {
  const map = await client.map.findFirst({
    where: {
      id: mapId,
      creatorId: userId,
    },
    include: {
      mapElements: { include: { element: true } },
      mapSpaces: {
        include: {
          space: { include: { elements: { include: { element: true } } } },
        },
      },
    },
  });

  if (!map) {
    throw new Error('Map not found or access denied');
  }

  return {
    id: map.id,
    name: map.name,
    width: map.width,
    height: map.height,
    ownerId: map.creatorId,
    elements: map.mapElements.map((me) => ({
      id: me.id,
      elementId: me.elementId,
      x: me.x,
      y: me.y,
      element: {
        id: me.element.id,
        imageUrl: me.element.imageUrl,
        width: me.element.width,
        height: me.element.height,
        isStatic: me.element.isStatic,
      },
    })),
    mapSpaces: map.mapSpaces.map((ms) => ({
      id: ms.id,
      spaceId: ms.spaceId,
      spaceName: ms.space.name,
      x: ms.x,
      y: ms.y,
      width: ms.space.width,
      height: ms.space.height,
      elements: ms.space.elements.map((se) => ({
        id: se.id,
        elementId: se.elementId,
        x: se.x,
        y: se.y,
        element: {
          id: se.element.id,
          imageUrl: se.element.imageUrl,
          width: se.element.width,
          height: se.element.height,
          isStatic: se.element.isStatic,
        },
      })),
    })),
  };
}

export async function addElementToAdminMap(
  userId: number,
  mapId: number,
  data: MapElementData
) {
  const parsedData = AddMapElementSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if map belongs to current admin
  const map = await client.map.findFirst({
    where: { id: mapId, creatorId: userId },
  });

  if (!map) {
    throw new Error('Map not found or access denied');
  }

  const mapElement = await client.mapElement.create({
    data: {
      mapId,
      elementId: parseInt(parsedData.data.elementId),
      x: parsedData.data.x,
      y: parsedData.data.y,
    },
  });

  return { id: mapElement.id };
}

export async function removeElementFromAdminMap(
  userId: number,
  mapId: number,
  data: DeleteElementData
) {
  const parsedData = DeleteElementSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if map belongs to current admin
  const map = await client.map.findFirst({
    where: { id: mapId, creatorId: userId },
  });

  if (!map) {
    throw new Error('Map not found or access denied');
  }

  await client.mapElement.delete({
    where: { id: parseInt(parsedData.data.id) },
  });

  return { message: 'Element removed' };
}

export async function addSpaceToAdminMap(
  userId: number,
  mapId: number,
  data: MapSpaceData
) {
  const parsedData = AddMapSpaceSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if map belongs to current admin
  const map = await client.map.findFirst({
    where: { id: mapId, creatorId: userId },
  });

  if (!map) {
    throw new Error('Map not found or access denied');
  }

  // Check if space exists and validate placement
  const space = await client.space.findFirst({
    where: { id: parseInt(parsedData.data.spaceId) },
  });

  if (!space) {
    throw new Error('Space not found');
  }

  // Check if the space fits within the map bounds
  if (
    parsedData.data.x + space.width > map.width ||
    parsedData.data.y + space.height > map.height ||
    parsedData.data.x < 0 ||
    parsedData.data.y < 0
  ) {
    throw new Error("Space doesn't fit within map bounds");
  }

  // Check for collisions with existing elements and spaces
  const existingMapElements = await client.mapElement.findMany({
    where: { mapId },
    include: { element: true },
  });

  const existingMapSpaces = await client.mapSpace.findMany({
    where: { mapId },
    include: { space: true },
  });

  // Check collision with elements
  for (const mapElement of existingMapElements) {
    const elemEndX = mapElement.x + mapElement.element.width;
    const elemEndY = mapElement.y + mapElement.element.height;
    const spaceEndX = parsedData.data.x + space.width;
    const spaceEndY = parsedData.data.y + space.height;

    if (
      !(
        parsedData.data.x >= elemEndX ||
        spaceEndX <= mapElement.x ||
        parsedData.data.y >= elemEndY ||
        spaceEndY <= mapElement.y
      )
    ) {
      throw new Error('Space collides with existing element');
    }
  }

  // Check collision with other spaces
  for (const mapSpace of existingMapSpaces) {
    const otherSpaceEndX = mapSpace.x + mapSpace.space.width;
    const otherSpaceEndY = mapSpace.y + mapSpace.space.height;
    const spaceEndX = parsedData.data.x + space.width;
    const spaceEndY = parsedData.data.y + space.height;

    if (
      !(
        parsedData.data.x >= otherSpaceEndX ||
        spaceEndX <= mapSpace.x ||
        parsedData.data.y >= otherSpaceEndY ||
        spaceEndY <= mapSpace.y
      )
    ) {
      throw new Error('Space collides with existing space');
    }
  }

  const mapSpace = await client.mapSpace.create({
    data: {
      mapId,
      spaceId: parseInt(parsedData.data.spaceId),
      x: parsedData.data.x,
      y: parsedData.data.y,
    },
  });

  return { id: mapSpace.id };
}

export async function removeSpaceFromAdminMap(
  userId: number,
  mapId: number,
  data: DeleteElementData
) {
  const parsedData = DeleteElementSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  // Check if map belongs to current admin
  const map = await client.map.findFirst({
    where: { id: mapId, creatorId: userId },
  });

  if (!map) {
    throw new Error('Map not found or access denied');
  }

  await client.mapSpace.delete({
    where: { id: parseInt(parsedData.data.id) },
  });

  return { message: 'Space removed from map' };
}
