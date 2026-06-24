import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2-config";
import logger from "../config/logger-config";
import AppError from "../errors/app-error";

const BUCKET_NAME    = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? '';
const R2_PUBLIC_URL  = process.env.CLOUDFLARE_R2_PUBLIC_URL  ?? '';

export const uploadFileToR2 = async (file: Express.Multer.File, folder: string): Promise<string> => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName      = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         fileName,
    Body:        file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await r2Client.send(command);
    logger.info(`File uploaded to R2: ${fileName}`);
    return `${R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    logger.error(`R2 upload failed for ${fileName}:`, error);
    throw new AppError('File upload failed. Please try again.', 500);
  }
};

export const deleteFileFromR2 = async (fileUrl: string): Promise<void> => {
  // extract the key by stripping the public URL prefix
  const key = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key:    key,
  });

  try {
    await r2Client.send(command);
    logger.info(`File deleted from R2: ${key}`);
  } catch (error) {
    // log but don't throw — deletion failure shouldn't block the upload
    logger.error(`R2 deletion failed for ${key}:`, error);
  }
};