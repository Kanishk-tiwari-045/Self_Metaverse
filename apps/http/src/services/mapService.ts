import client from '@repo/db/client';

export async function getElements() {
  const elements = await client.element.findMany();

  return {
    elements: elements.map((e) => ({
      id: e.id,
      imageUrl: e.imageUrl,
      width: e.width,
      height: e.height,
      isStatic: e.isStatic,
    })),
  };
}

export async function getAvatars() {
  const avatars = await client.avatar.findMany();

  return {
    avatars: avatars.map((x) => ({
      id: x.id,
      imageUrl: x.imageUrl,
      name: x.name,
    })),
  };
}

export async function getPublicMaps() {
  const maps = await client.map.findMany({
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
      dimensions: `${m.width}x${m.height}`,
      accessCode: m.accessCode,
      isTemplate: m.isTemplate,
    })),
  };
}

export async function getMapDetails(mapId: number) {
  const map = await client.map.findFirst({
    where: { id: mapId },
    include: {
      mapElements: { include: { element: true } },
      mapSpaces: {
        include: {
          space: { include: { elements: { include: { element: true } } } },
        },
      },
      creator: { select: { id: true, username: true } },
    },
  });

  if (!map) {
    throw new Error('Map not found');
  }

  return {
    id: map.id,
    name: map.name,
    width: map.width,
    height: map.height,
    ownerId: map.creatorId,
    owner: map.creator.username,
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

export async function getTemplates() {
  const templates = await client.map.findMany({
    where: { isTemplate: true },
    include: {
      creator: { select: { username: true } },
    },
    orderBy: { id: 'desc' },
  });

  return {
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      width: template.width,
      height: template.height,
      category: 'Template',
      creatorName: template.creator.username,
    })),
  };
}

export async function getMapByCode(accessCode: string) {
  const map = await client.map.findFirst({
    where: { accessCode: accessCode.toUpperCase() },
    include: {
      creator: { select: { username: true } },
    },
  });

  if (!map) {
    throw new Error('Map not found');
  }

  return {
    id: map.id,
    name: map.name,
    width: map.width,
    height: map.height,
    accessCode: map.accessCode,
    owner: map.creator.username,
  };
}

export async function getMapForEdit(mapId: number, userId: number) {
  const map = await client.map.findFirst({
    where: {
      id: mapId,
      creatorId: userId, // Only allow access to own maps
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
