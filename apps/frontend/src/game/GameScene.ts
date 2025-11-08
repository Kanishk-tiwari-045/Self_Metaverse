import Phaser from 'phaser';
import { CELL_SIZE, POSITION_DELAY } from './constants';
import { HasPlayerMovedInterface } from './types';
import { PlayerMovement } from './PlayerMovement';
import { PlayersPositionInterpolator } from './PlayersPositionInterpolator';
import {
  createAvatarTexture,
  getAvatarKey,
  AVATAR_COLORS,
} from './avatarUtils';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private onMovement: (x: number, y: number) => void;
  private isDragging: boolean = false;
  private lastPointerPosition: { x: number; y: number } = { x: 0, y: 0 };
  private playersPositionInterpolator = new PlayersPositionInterpolator();
  private currentTick = 0;
  private lastSentTick = 0; // Track tick time of last sent position
  private lastMovementSent: {
    x: number;
    y: number;
    direction: string;
    moving: boolean;
  } = { x: -1, y: -1, direction: 'down', moving: false };
  private playerDirection: 'up' | 'down' | 'left' | 'right' = 'down';

  constructor(onMovement: (x: number, y: number) => void) {
    super({ key: 'GameScene' });
    this.onMovement = onMovement;
  }

  preload() {
    // Load Tiled map JSON
    this.load.tilemapTiledJSON('map', '/office.tmj');

    // Load tileset images with proper filtering for pixel art
    const tilesets = [
      'WA_Special_Zones',
      'WA_Decoration',
      'WA_Miscellaneous',
      'WA_Other_Furniture',
      'WA_Room_Builder',
      'WA_Seats',
      'WA_Tables',
      'WA_Logo_Long',
      'WA_Exterior',
      'WA_User_Interface',
    ];

    tilesets.forEach((tilesetName) => {
      this.load.image(tilesetName, `/tilesets/${tilesetName}.png`);
    });

    // Set nearest neighbor filtering on loaded images to prevent black lines
    this.load.on('filecomplete-image', (key: string) => {
      if (tilesets.includes(key)) {
        const texture = this.textures.get(key);
        if (texture) {
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
      }
    });

    console.log(
      'Preload complete - avatar textures will be created in create()'
    );
  }

  setCurrentUser(userId: string | number, avatarUrl?: string) {
    console.log(`Setting current user: ${userId}, avatarUrl: ${avatarUrl}`);

    // Update player avatar
    if (this.player) {
      if (avatarUrl) {
        const avatarKey = `user_avatar_${userId}`;
        console.log(
          `Loading avatar texture: ${avatarKey} from URL: ${avatarUrl}`
        );
        if (!this.textures.exists(avatarKey)) {
          this.load.image(avatarKey, avatarUrl);
          this.load.once('complete', () => {
            console.log(`Avatar texture loaded successfully: ${avatarKey}`);
            this.setPlayerAvatarTexture(avatarKey);
          });
          this.load.once('loaderror', () => {
            console.error(
              `Failed to load avatar texture: ${avatarKey} from ${avatarUrl}`
            );
          });
          this.load.start();
        } else {
          console.log(`Avatar texture already exists: ${avatarKey}`);
          this.setPlayerAvatarTexture(avatarKey);
        }
      } else {
        const avatarKey = getAvatarKey(userId);
        console.log(
          `No avatar URL provided, using fallback texture: ${avatarKey}`
        );
        this.player.setTexture(avatarKey);
      }

      // Ensure the player is visible by setting alpha and scale
      this.player.setAlpha(1);
      this.player.setScale(1);
      this.player.setVisible(true);

      console.log('Player texture updated and made visible');
    }
  }

  private setPlayerAvatarTexture(textureKey: string) {
    if (!this.player) return;

    const texture = this.textures.get(textureKey);
    // Use same logic as SpaceViewPage: if it's an avatar texture key, use it
    const isAvatarTexture = !!(
      textureKey.startsWith('user_avatar_') ||
      (textureKey.startsWith('avatar_') && texture && texture.source[0])
    );
    const isSpritesheet = !!(
      texture &&
      texture.source[0] &&
      texture.source[0].width >= 96 &&
      texture.source[0].height >= 128
    );

    console.log(
      `Setting player avatar texture: ${textureKey}, isAvatarTexture: ${isAvatarTexture}, isSpritesheet: ${isSpritesheet}`
    );
    console.log(
      `Texture dimensions: ${texture.source[0]?.width}x${texture.source[0]?.height}`
    );

    if (isAvatarTexture) {
      // Always use avatar texture for loaded avatar images
      this.player.setTexture(textureKey);
      this.player.setData('textureKey', textureKey);

      // Check if it's a proper spritesheet (96x128 or larger)
      if (isSpritesheet) {
        // Create spritesheet from the loaded image
        const spriteSheetKey = `${textureKey}_sheet`;
        if (!this.textures.exists(spriteSheetKey)) {
          console.log(
            `Creating spritesheet: ${spriteSheetKey} from ${texture.source[0].width}x${texture.source[0].height} image`
          );
          this.textures.addSpriteSheet(
            spriteSheetKey,
            texture.source[0].source as HTMLImageElement,
            {
              frameWidth: 32,
              frameHeight: 32,
            }
          );
        }

        // Create animations with fixed direction order: down=0, left=1, right=2, up=3
        const directions = ['down', 'left', 'right', 'up'];
        directions.forEach((direction, dirIndex) => {
          const animKey = `${textureKey}_${direction}`;
          if (!this.anims.exists(animKey)) {
            console.log(
              `Creating animation: ${animKey} for direction ${direction} (frames ${dirIndex * 3}-${(dirIndex + 1) * 3 - 1})`
            );
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers(spriteSheetKey, {
                start: dirIndex * 3,
                end: (dirIndex + 1) * 3 - 1,
              }),
              frameRate: 8,
              repeat: -1,
            });
          }
        });

        this.player.setTexture(spriteSheetKey);
        this.player.setDisplaySize(32, 32); // Ensure correct size after texture change
        this.player.play(`${textureKey}_down`);
        this.player.setData('direction', 'down');
        console.log(
          `Player now using animated spritesheet: ${spriteSheetKey} with animation: ${textureKey}_down`
        );
      } else {
        // Single frame avatar - still use it as the player texture
        console.log(
          `Player using single-frame avatar: ${textureKey} (${texture.source[0].width}x${texture.source[0].height})`
        );
        this.player.setTexture(textureKey);
        this.player.setData('direction', 'down');
      }
    } else {
      // Use colored fallback texture
      this.player.setTexture(textureKey);
      console.log(`Player using fallback colored texture: ${textureKey}`);
    }

    this.player.setDisplaySize(32, 32);
  }

  create() {
    // Create avatar textures FIRST in create() instead of preload()
    console.log('Creating avatar textures...');
    AVATAR_COLORS.forEach((color, index) => {
      createAvatarTexture(this, `avatar_${index}`, color);
    });
    console.log('Avatar textures created successfully');

    // Verify textures exist
    for (let i = 0; i < AVATAR_COLORS.length; i++) {
      const key = `avatar_${i}`;
      const exists = this.textures.exists(key);
      console.log(`Texture ${key} exists:`, exists);
    }

    // Create map
    const map = this.make.tilemap({ key: 'map' });

    // Add tilesets
    const specialZones = map.addTilesetImage(
      'WA_Special_Zones',
      'WA_Special_Zones'
    );
    const decoration = map.addTilesetImage('WA_Decoration', 'WA_Decoration');
    const miscellaneous = map.addTilesetImage(
      'WA_Miscellaneous',
      'WA_Miscellaneous'
    );
    const otherFurniture = map.addTilesetImage(
      'WA_Other_Furniture',
      'WA_Other_Furniture'
    );
    const roomBuilder = map.addTilesetImage(
      'WA_Room_Builder',
      'WA_Room_Builder'
    );
    const seats = map.addTilesetImage('WA_Seats', 'WA_Seats');
    const tables = map.addTilesetImage('WA_Tables', 'WA_Tables');
    const logoLong = map.addTilesetImage('WA_Logo_Long', 'WA_Logo_Long');
    const exterior = map.addTilesetImage('WA_Exterior', 'WA_Exterior');
    const userInterface = map.addTilesetImage(
      'WA_User_Interface',
      'WA_User_Interface'
    );

    // Create layers
    map.createLayer(
      'floor/floor1',
      [roomBuilder!, seats!, tables!, exterior!],
      0,
      0
    );
    map.createLayer(
      'floor/floor2',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
      ],
      0,
      0
    );
    const wallsLayer1 = map.createLayer(
      'walls/walls1',
      [roomBuilder!, seats!, tables!, exterior!, logoLong!],
      0,
      0
    );
    const wallsLayer2 = map.createLayer(
      'walls/walls2',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
        logoLong!,
        exterior!,
      ],
      0,
      0
    );
    map.createLayer(
      'furniture/furniture1',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
      ],
      0,
      0
    );
    map.createLayer(
      'furniture/furniture2',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
      ],
      0,
      0
    );
    map.createLayer(
      'furniture/furniture3',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
      ],
      0,
      0
    );
    const above1Layer = map.createLayer(
      'above/above1',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
        logoLong!,
        exterior!,
      ],
      0,
      0
    );
    const above2Layer = map.createLayer(
      'above/above2',
      [
        decoration!,
        miscellaneous!,
        otherFurniture!,
        seats!,
        tables!,
        userInterface!,
        logoLong!,
        exterior!,
      ],
      0,
      0
    );

    // Make "above" layers semi-transparent so players are always visible
    above1Layer?.setAlpha(0.7);
    above2Layer?.setAlpha(0.7);

    // Set collision for walls and collisions layer
    wallsLayer1?.setCollisionByProperty({ collides: true });
    wallsLayer2?.setCollisionByProperty({ collides: true });
    const collisionsLayer = map.createLayer(
      'collisions',
      [specialZones!],
      0,
      0
    );
    collisionsLayer?.setCollisionByProperty({ collides: true });

    // CRITICAL: Hide the collisions layer - it's only for collision detection, not visual display
    collisionsLayer?.setVisible(false);

    // Set depths for map layers - using tile depth like WorkAdventure
    // Also disable anti-aliasing for crisp rendering
    const floor1Layer = map.getLayer('floor/floor1')?.tilemapLayer;
    const floor2Layer = map.getLayer('floor/floor2')?.tilemapLayer;
    const furniture1Layer = map.getLayer('furniture/furniture1')?.tilemapLayer;
    const furniture2Layer = map.getLayer('furniture/furniture2')?.tilemapLayer;
    const furniture3Layer = map.getLayer('furniture/furniture3')?.tilemapLayer;

    floor1Layer?.setDepth(0);
    floor2Layer?.setDepth(0);
    wallsLayer1?.setDepth(0);
    wallsLayer2?.setDepth(0);
    furniture1Layer?.setDepth(0);
    furniture2Layer?.setDepth(0);
    furniture3Layer?.setDepth(0);
    collisionsLayer?.setDepth(0);
    above1Layer?.setDepth(1000000);
    above2Layer?.setDepth(1000000);

    // Configure tilemap layers for crisp pixel art rendering and prevent black lines
    [
      floor1Layer,
      floor2Layer,
      wallsLayer1,
      wallsLayer2,
      furniture1Layer,
      furniture2Layer,
      furniture3Layer,
      above1Layer,
      above2Layer,
    ].forEach((layer) => {
      if (layer) {
        layer.setSkipCull(true); // Prevent culling issues
        // Round tile positions to prevent sub-pixel rendering
        layer.forEachTile((tile: any) => {
          if (tile.index !== -1) {
            tile.pixelX = Math.round(tile.pixelX);
            tile.pixelY = Math.round(tile.pixelY);
          }
        });
        // Set the layer to use nearest neighbor filtering by accessing the tileset textures
        layer.tileset.forEach((tileset: any) => {
          if (tileset && tileset.image) {
            const texture = this.textures.get(tileset.image.key);
            if (texture) {
              texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
          }
        });
      }
    });

    console.log(
      'Layer depths set - tiles at 0, players use Y-coordinate, overlays at 1,000,000'
    );

    // Create player as simple sprite (will be updated with avatar when setCurrentUser is called)
    const startX = 200;
    const startY = 200;
    this.player = this.add.sprite(startX, startY, 'avatar_0');
    this.player.setDisplaySize(32, 32);
    this.player.setOrigin(0.5, 0.5);

    // Initialize player direction
    this.player.setData('direction', 'down');

    // Add physics body separately
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(32, 32);

    // Use Y coordinate as depth like WorkAdventure
    this.player.setDepth(this.player.y + 16);

    // Force visibility
    this.player.setVisible(true);
    this.player.setAlpha(1.0);
    this.player.setScrollFactor(1);

    console.log(
      'Player created at:',
      startX,
      startY,
      'with texture:',
      this.player.texture.key
    );
    console.log('Player using Y-based depth:', this.player.y + 16);
    console.log(
      'Player visible:',
      this.player.visible,
      'depth:',
      this.player.depth
    );

    // Set up collisions using the player body
    if (wallsLayer1) this.physics.add.collider(this.player, wallsLayer1);
    if (wallsLayer2) this.physics.add.collider(this.player, wallsLayer2);
    if (collisionsLayer)
      this.physics.add.collider(this.player, collisionsLayer);

    // Camera setup with proper bounds and anti-aliasing fixes
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(1);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);
    this.cameras.main.setRoundPixels(true);

    // Configure camera for crisp pixel art rendering and prevent black lines
    this.cameras.main.setOrigin(0.5, 0.5);
    // Force camera to use pixel-perfect positioning
    this.cameras.main.useBounds = true;

    console.log(
      'Camera bounds set to:',
      map.widthInPixels,
      'x',
      map.heightInPixels
    );
    console.log('Camera following player with deadzone');

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Set up mouse wheel zoom (like WorkAdventure)
    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: any,
        _deltaX: number,
        deltaY: number
      ) => {
        this.handleMouseWheel(deltaY);
      }
    );

    // Set up mouse/touch drag for camera panning
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.lastPointerPosition.x = pointer.worldX;
        this.lastPointerPosition.y = pointer.worldY;
        this.cameras.main.stopFollow();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = this.lastPointerPosition.x - pointer.worldX;
        const deltaY = this.lastPointerPosition.y - pointer.worldY;
        this.cameras.main.scrollX += deltaX;
        this.cameras.main.scrollY += deltaY;
        this.lastPointerPosition.x = pointer.worldX;
        this.lastPointerPosition.y = pointer.worldY;
      }
    });

    this.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      }
    });

    this.input.keyboard!.enabled = true;
    this.game.canvas.focus();
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.cursors) return;

    this.currentTick += delta;

    // Ensure pixel-perfect camera positioning to prevent black lines
    this.cameras.main.scrollX = Math.round(this.cameras.main.scrollX);
    this.cameras.main.scrollY = Math.round(this.cameras.main.scrollY);

    // Always update depth based on Y position
    this.player.setDepth(this.player.y + 16);

    // Ensure player stays visible every frame
    if (!this.player.visible) {
      console.warn('Player became invisible! Re-enabling...');
      this.player.setVisible(true);
      this.player.setAlpha(1.0);
    }

    // Update interpolated positions for other players
    const updatedPositions =
      this.playersPositionInterpolator.getUpdatedPositions(this.currentTick);
    updatedPositions.forEach(
      (moveEvent: HasPlayerMovedInterface, userId: number) => {
        this.updateOtherPlayerPosition(String(userId), moveEvent);
      }
    );

    // Ensure all other players stay visible
    this.otherPlayers.forEach((sprite, userId) => {
      if (!sprite.visible) {
        console.warn(`Other player ${userId} became invisible! Re-enabling...`);
        sprite.setVisible(true);
        sprite.setAlpha(1.0);
      }
      sprite.setDepth(sprite.y + 16);
    });

    // Movement using player body
    let moved = false;
    let newDirection = this.playerDirection;

    if (this.cursors.left.isDown) {
      this.playerBody.setVelocityX(-160);
      moved = true;
      newDirection = 'left';
    } else if (this.cursors.right.isDown) {
      this.playerBody.setVelocityX(160);
      moved = true;
      newDirection = 'right';
    } else {
      this.playerBody.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.playerBody.setVelocityY(-160);
      moved = true;
      newDirection = 'up';
    } else if (this.cursors.down.isDown) {
      this.playerBody.setVelocityY(160);
      moved = true;
      newDirection = 'down';
    } else {
      this.playerBody.setVelocityY(0);
    }

    // Update animation if direction changed
    if (newDirection !== this.playerDirection) {
      this.playerDirection = newDirection;
      const storedTextureKey = this.player.getData('textureKey');
      if (storedTextureKey) {
        const animKey = `${storedTextureKey}_${newDirection}`;
        if (this.anims.exists(animKey)) {
          this.player.play(animKey);
          console.log(`Playing player animation: ${animKey}`);
        }
      }
    }

    // approach: Send updates on state changes OR time threshold
    const currentState = {
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      direction: newDirection,
      moving: moved,
    };

    // Send if: player stopped, direction changed, or 200ms elapsed
    const shouldSend =
      (!moved && this.lastMovementSent.moving) || // Just stopped
      (moved && newDirection !== this.lastMovementSent.direction) || // Changed direction
      (moved && this.currentTick - this.lastSentTick >= POSITION_DELAY); // Time threshold

    if (shouldSend) {
      this.lastMovementSent = currentState;
      this.lastSentTick = this.currentTick;
      this.onMovement(currentState.x, currentState.y);
    }
  }

  setPlayerPosition(x: number, y: number) {
    if (this.player) {
      const worldX = x * CELL_SIZE;
      const worldY = y * CELL_SIZE;
      console.log(
        `Setting player position to: (${worldX}, ${worldY}) from grid (${x}, ${y})`
      );

      this.player.setPosition(worldX, worldY);
      this.player.setDepth(worldY + 16);
      this.player.setVisible(true);
      this.player.setAlpha(1.0);
      this.player.setActive(true);

      console.log('Player position updated. Y-based depth:', worldY + 16);
      console.log('Player world position:', this.player.x, this.player.y);
    }
  }

  addOtherPlayer(
    userId: string | number,
    x: number,
    y: number,
    avatarUrl?: string
  ) {
    const userIdString = String(userId);

    console.log(
      `Adding other player: ${userIdString} (original type: ${typeof userId}) at grid (${x}, ${y}), world (${x * CELL_SIZE}, ${y * CELL_SIZE}), avatarUrl: ${avatarUrl}`
    );

    if (this.otherPlayers.has(userIdString)) {
      console.log(
        `Player ${userIdString} already exists, removing old sprite first`
      );
      this.removeOtherPlayer(userIdString);
    }

    const worldX = x * CELL_SIZE;
    const worldY = y * CELL_SIZE;

    if (avatarUrl) {
      // Load avatar image dynamically
      const avatarKey = `user_avatar_${userIdString}`;
      console.log(
        `Loading other player avatar: ${avatarKey} from URL: ${avatarUrl}`
      );
      if (!this.textures.exists(avatarKey)) {
        this.load.image(avatarKey, avatarUrl);
        this.load.once('complete', () => {
          console.log(`Other player avatar loaded successfully: ${avatarKey}`);
          this.createPlayerSprite(userIdString, worldX, worldY, avatarKey);
        });
        this.load.once('loaderror', () => {
          console.error(
            `Failed to load other player avatar: ${avatarKey} from ${avatarUrl}`
          );
          // Fallback to colored avatar
          const fallbackKey = getAvatarKey(userIdString);
          this.createPlayerSprite(userIdString, worldX, worldY, fallbackKey);
        });
        this.load.start();
      } else {
        console.log(`Other player avatar already exists: ${avatarKey}`);
        this.createPlayerSprite(userIdString, worldX, worldY, avatarKey);
      }
    } else {
      // Fallback to colored avatar
      const avatarKey = getAvatarKey(userIdString);
      console.log(
        `No avatar URL for user ${userIdString}, using fallback: ${avatarKey}`
      );

      if (!this.textures.exists(avatarKey)) {
        console.error(`Texture ${avatarKey} does not exist!`);
        return;
      }
      this.createPlayerSprite(userIdString, worldX, worldY, avatarKey);
    }
  }

  private createPlayerSprite(
    userIdString: string,
    worldX: number,
    worldY: number,
    textureKey: string
  ) {
    const texture = this.textures.get(textureKey);

    // Use same logic as SpaceViewPage: if it's an avatar texture key, use it
    const isAvatarTexture = !!(
      textureKey.startsWith('user_avatar_') ||
      (textureKey.startsWith('avatar_') && texture && texture.source[0])
    );
    const isSpritesheet = !!(
      texture &&
      texture.source[0] &&
      texture.source[0].width >= 96 &&
      texture.source[0].height >= 128
    );

    if (isAvatarTexture && isSpritesheet) {
      // Create sprite with the avatar texture
      const sprite = this.add.sprite(worldX, worldY, textureKey);
      sprite.setDisplaySize(32, 32);
      sprite.setDepth(worldY + 16);
      sprite.setVisible(true);
      sprite.setAlpha(1.0);
      sprite.setActive(true);
      sprite.setScrollFactor(1);
      sprite.setOrigin(0.5, 0.5);
      sprite.setData('direction', 'down');
      sprite.setData('textureKey', textureKey);

      // Check if it's a spritesheet for animations
      if (isSpritesheet) {
        const spriteSheetKey = `${textureKey}_sheet`;
        if (!this.textures.exists(spriteSheetKey)) {
          console.log(
            `Creating other player spritesheet: ${spriteSheetKey} from ${texture.source[0].width}x${texture.source[0].height}`
          );
          this.textures.addSpriteSheet(
            spriteSheetKey,
            texture.source[0].source as HTMLImageElement,
            {
              frameWidth: 32,
              frameHeight: 32,
            }
          );
        }

        // Create animations with correct direction mapping
        const directions = ['down', 'left', 'right', 'up']; // Fixed order: down=0, left=1, right=2, up=3
        directions.forEach((direction, dirIndex) => {
          const animKey = `${textureKey}_${direction}`;
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers(spriteSheetKey, {
                start: dirIndex * 3,
                end: (dirIndex + 1) * 3 - 1,
              }),
              frameRate: 8,
              repeat: -1,
            });
          }
        });

        // Update sprite to use spritesheet
        sprite.setTexture(spriteSheetKey);
        sprite.setDisplaySize(32, 32); // Ensure correct size after texture change
        sprite.play(`${textureKey}_down`);
        console.log(
          `Other player ${userIdString} using animated avatar: ${spriteSheetKey}`
        );
      } else {
        console.log(
          `Other player ${userIdString} using static avatar: ${textureKey} (${texture.source[0].width}x${texture.source[0].height})`
        );
      }

      // Add name label
      const nameText = this.add.text(
        worldX,
        worldY - 20,
        `User ${userIdString}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 6, y: 3 },
          resolution: 2,
        }
      );
      nameText.setOrigin(0.5, 0.5);
      nameText.setDepth(1000);
      nameText.setScrollFactor(1);
      nameText.setAlpha(0.95);

      sprite.setData('nameText', nameText);
      this.otherPlayers.set(userIdString, sprite);

      console.log(
        `Other player ${userIdString} created with animated sprite. Visible:`,
        sprite.visible,
        'Depth:',
        sprite.depth,
        'Position:',
        sprite.x,
        sprite.y
      );
    } else {
      // Fallback for non-spritesheet images or colored avatars
      const sprite = this.add.sprite(worldX, worldY, textureKey);
      sprite.setDisplaySize(32, 32);
      sprite.setDepth(worldY + 16);
      sprite.setVisible(true);
      sprite.setAlpha(1.0);
      sprite.setActive(true);
      sprite.setScrollFactor(1);
      sprite.setOrigin(0.5, 0.5);

      // Add name label
      const nameText = this.add.text(
        worldX,
        worldY - 20,
        `User ${userIdString}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 6, y: 3 },
          resolution: 2,
        }
      );
      nameText.setOrigin(0.5, 0.5);
      nameText.setDepth(1000);
      nameText.setScrollFactor(1);
      nameText.setAlpha(0.95);

      sprite.setData('nameText', nameText);
      sprite.setData('textureKey', textureKey); // Store texture key for static sprites too
      this.otherPlayers.set(userIdString, sprite);

      console.log(
        `Other player ${userIdString} created with static sprite (${textureKey}). Visible:`,
        sprite.visible,
        'Depth:',
        sprite.depth,
        'Position:',
        sprite.x,
        sprite.y
      );
    }

    console.log(
      `Total players in map:`,
      this.otherPlayers.size,
      'Keys:',
      Array.from(this.otherPlayers.keys())
    );
  }

  updateOtherPlayerMovement(
    userId: string | number,
    pixelX: number,
    pixelY: number
  ) {
    const userIdString = String(userId);
    const sprite = this.otherPlayers.get(userIdString);

    if (!sprite) {
      console.error(
        `Cannot update movement for player ${userIdString} - sprite not found.`
      );
      return;
    }

    // Calculate direction based on movement (using pixels)
    let direction = sprite.getData('direction') || 'down';

    if (pixelX > sprite.x + 5) direction = 'right';
    else if (pixelX < sprite.x - 5) direction = 'left';
    else if (pixelY > sprite.y + 5) direction = 'down';
    else if (pixelY < sprite.y - 5) direction = 'up';

    sprite.setData('direction', direction);

    console.log(
      `Updating player ${userIdString} movement from (${Math.round(sprite.x)}, ${Math.round(sprite.y)})px to (${pixelX}, ${pixelY})px, direction: ${direction}`
    );

    // Interpolate between PIXEL positions (not grid)
    const startPosition = { x: sprite.x, y: sprite.y }; // Current pixel position
    const endPosition: HasPlayerMovedInterface = {
      x: pixelX, // Target pixel position
      y: pixelY,
      moving: true,
    };
    const playerMovement = new PlayerMovement(
      startPosition,
      this.currentTick,
      endPosition,
      this.currentTick + POSITION_DELAY
    );
    this.playersPositionInterpolator.updatePlayerPosition(
      Number(userId),
      playerMovement
    );
  }

  updateOtherPlayerPosition(
    userId: string,
    moveEvent: HasPlayerMovedInterface
  ) {
    const sprite = this.otherPlayers.get(userId);
    if (sprite) {
      // moveEvent.x and moveEvent.y are now PIXELS (not grid)
      const pixelX = moveEvent.x;
      const pixelY = moveEvent.y;

      sprite.setPosition(pixelX, pixelY);
      sprite.setDepth(pixelY + 16);

      // Update animation based on direction
      const direction = sprite.getData('direction') || 'down';
      const storedTextureKey = sprite.getData('textureKey');
      if (storedTextureKey) {
        const animKey = `${storedTextureKey}_${direction}`;
        if (this.anims.exists(animKey)) {
          sprite.play(animKey, true); // true = ignoreIfPlaying
        }
      }

      const nameText = sprite.getData('nameText');
      if (nameText) {
        nameText.setPosition(pixelX, pixelY - 20);
        nameText.setDepth(pixelY + 17);
      }
    }
  }

  removeOtherPlayer(userId: string) {
    const sprite = this.otherPlayers.get(userId);
    if (sprite) {
      const nameText = sprite.getData('nameText');
      if (nameText) {
        nameText.destroy();
      }
      sprite.destroy();
      this.otherPlayers.delete(userId);
      console.log(`Other player ${userId} removed`);
    }
    this.playersPositionInterpolator.removePlayer(parseInt(userId));
  }

  handleMouseWheel(deltaY: number) {
    // Calculate zoom factor from mouse wheel delta
    let zoomFactor = Math.exp((-deltaY * Math.log(2)) / 100);

    // Clamp to prevent extreme zooming
    zoomFactor = Math.max(0.5, Math.min(2, zoomFactor));

    // Get current zoom
    const currentZoom = this.cameras.main.zoom;
    const newZoom = currentZoom * zoomFactor;

    // Apply limits (0.5x to 3x like WorkAdventure)
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));

    // Round zoom to prevent sub-pixel rendering artifacts
    const roundedZoom = Math.round(clampedZoom * 100) / 100;

    // Set zoom immediately with pixel-perfect positioning
    this.cameras.main.setZoom(roundedZoom);

    // Force camera position rounding to prevent black lines
    this.cameras.main.scrollX = Math.round(this.cameras.main.scrollX);
    this.cameras.main.scrollY = Math.round(this.cameras.main.scrollY);

    console.log(`Zoom: ${currentZoom.toFixed(2)} -> ${roundedZoom.toFixed(2)}`);
  }
}
