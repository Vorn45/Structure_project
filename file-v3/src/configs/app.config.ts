import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  appName: process.env.APP_NAME || 'file-v3',
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads'),
  maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)) * 1024 * 1024,
  allowedMimeTypes: (
    process.env.ALLOWED_MIME_TYPES ||
    'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,text/plain'
  ).split(',').map((t) => t.trim().toLowerCase()),
};
