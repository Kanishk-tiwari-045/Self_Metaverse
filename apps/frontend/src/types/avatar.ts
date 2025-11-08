export interface AvatarTexture {
  id: string;
  name: string;
  url: string;
  position: number;
  gender: 'male' | 'female';
}

export interface AvatarCollection {
  name: string;
  position: number;
  textures: AvatarTexture[];
}

export interface AvatarData {
  avatars: {
    collections: AvatarCollection[];
  };
}

export interface SelectedAvatar {
  id: string;
  textureUrl: string;
  name: string;
  gender: 'male' | 'female';
}
