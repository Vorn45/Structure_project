import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '../configs/app.config';
import { BadRequestException } from '../exceptions/http.exception';
import { FileUtil } from './file.util';

// Ensure upload directory exists
if (!fs.existsSync(appConfig.uploadDir)) {
  fs.mkdirSync(appConfig.uploadDir, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, appConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = uuidv4();
    const sanitizedOriginal = FileUtil.sanitizeFilename(file.originalname);
    const uniqueFilename = `${Date.now()}-${uniqueId.substring(0, 8)}-${sanitizedOriginal}`;
    cb(null, uniqueFilename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (FileUtil.isAllowedMimeType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `MIME type "${file.mimetype}" is not allowed. Allowed types: ${appConfig.allowedMimeTypes.join(', ')}`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.maxFileSizeBytes,
  },
  fileFilter,
});
