import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';

// Use environment variables from .env file
const AWS_REGION = process.env.AWS_S3_REGION || 'us-east-1';
const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME ||
  process.env.AWS_BUCKET_NAME ||
  'self-metaverse-maps';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload a TMJ file to S3 from the local pre-maps directory
 *
 * IMPORTANT: For public access, ensure your S3 bucket has:
 * 1. Public access enabled (Block Public Access: OFF)
 * 2. Bucket policy allowing public read access
 *
 * Example bucket policy:
 * {
 *   "Version": "2012-10-17",
 *   "Statement": [{
 *     "Sid": "PublicReadGetObject",
 *     "Effect": "Allow",
 *     "Principal": "*",
 *     "Action": "s3:GetObject",
 *     "Resource": "arn:aws:s3:::self-metaverse-maps/*"
 *   }]
 * }
 *
 * Alternatively, use getSignedTmjUrl() for temporary private access
 */
export async function uploadTmjToS3(
  userId: number,
  mapId: number,
  tmjTemplate: string
): Promise<string> {
  try {
    // Read the TMJ file from pre-maps directory
    const tmjFilePath = path.join(
      process.cwd(),
      '..',
      'frontend',
      'public',
      'pre-maps',
      tmjTemplate
    );

    console.log(`Reading TMJ file from: ${tmjFilePath}`);
    const tmjContent = await fs.readFile(tmjFilePath, 'utf-8');

    // S3 key structure: maps/{userId}/{mapId}/map.tmj
    const s3Key = `maps/${userId}/${mapId}/map.tmj`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: tmjContent,
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    console.log(`Uploaded TMJ to S3: ${s3Key}`);

    // Return the public URL
    // Format: https://{bucket-name}.s3.{region}.amazonaws.com/{key}
    const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    console.log(`S3 Public URL: ${url}`);
    return url;
  } catch (error) {
    console.error('Error uploading TMJ to S3:', error);
    throw new Error('Failed to upload TMJ file to S3');
  }
}

/**
 * Get a signed URL for accessing a private TMJ file
 */
export async function getSignedTmjUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Get available TMJ templates
 */
export interface TmjTemplateInfo {
  filename: string;
  displayName: string;
  width: number;
  height: number;
}

export const AVAILABLE_TMJ_TEMPLATES: TmjTemplateInfo[] = [
  {
    filename: 'office.tmj',
    displayName: 'Office Layout',
    width: 31,
    height: 21,
  },
  {
    filename: 'conference.tmj',
    displayName: 'Conference Room',
    width: 24,
    height: 14,
  },
];

export function getAvailableTmjTemplates(): TmjTemplateInfo[] {
  return AVAILABLE_TMJ_TEMPLATES;
}
