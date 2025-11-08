import { SignupSchema, SigninSchema } from '../types';
import { hash, compare } from '../scrypt';
import client from '@repo/db/client';
import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from '../config';

export interface SignupData {
  username: string;
  password: string;
  type: 'user' | 'admin';
}

export interface SigninData {
  username: string;
  password: string;
}

export async function signup(userData: SignupData) {
  const parsedData = SignupSchema.safeParse(userData);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  const hashedPassword = await hash(parsedData.data.password);

  const user = await client.user.create({
    data: {
      username: parsedData.data.username,
      password: hashedPassword,
      role: parsedData.data.type === 'admin' ? 'admin' : 'user',
    },
  });

  return { userId: user.id };
}

export async function signin(credentials: SigninData) {
  const parsedData = SigninSchema.safeParse(credentials);
  if (!parsedData.success) {
    throw new Error('Validation failed');
  }

  const user = await client.user.findUnique({
    where: { username: parsedData.data.username },
    include: {
      avatar: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await compare(parsedData.data.password, user.password);
  if (!isValid) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_PASSWORD);

  return {
    token,
    user: {
      id: user.id.toString(),
      username: user.username,
      role: user.role,
      avatar: user.avatar
        ? {
            id: user.avatar.id.toString(),
            name: user.avatar.name,
            imageUrl: user.avatar.imageUrl,
          }
        : null,
    },
  };
}
