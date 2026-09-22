import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileDatabase } from '../database';
import { IFileRecord } from '../models/file.model';
import { ApiResponse } from '../shared/response.shared';
import { FileUtil } from '../shared/file.util';
import { BadRequestException, NotFoundException } from '../exceptions/http.exception';
import { appConfig } from '../configs/app.config';

export class FileController {
  public static async uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestException('No file uploaded. Please attach a file with field name "file".');
      }

      const file = req.file;
      const urls = FileUtil.getFileUrls(file.filename);

      const record: IFileRecord = {
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        formattedSize: FileUtil.formatBytes(file.size),
        path: file.path,
        url: urls.url,
        downloadUrl: urls.downloadUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      FileDatabase.save(record);

      ApiResponse.success(res, { file: record }, 'File uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded. Please attach files with field name "files".');
      }

      const records: IFileRecord[] = [];

      for (const file of files) {
        const urls = FileUtil.getFileUrls(file.filename);
        const record: IFileRecord = {
          id: uuidv4(),
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          formattedSize: FileUtil.formatBytes(file.size),
          path: file.path,
          url: urls.url,
          downloadUrl: urls.downloadUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        FileDatabase.save(record);
        records.push(record);
      }

      ApiResponse.success(
        res,
        { files: records, total: records.length },
        `${records.length} files uploaded successfully`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = FileDatabase.findAll();
      ApiResponse.success(res, { files: records, total: records.length });
    } catch (error) {
      next(error);
    }
  }

  public static async getFileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const record = FileDatabase.findById(id);

      if (!record) {
        throw new NotFoundException(`File record with ID "${id}" was not found.`);
      }

      ApiResponse.success(res, { file: record });
    } catch (error) {
      next(error);
    }
  }

  public static async viewFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filename = String(req.params.filename);
      const filePath = path.resolve(appConfig.uploadDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`File "${filename}" not found on storage.`);
      }

      const record = FileDatabase.findByFilename(filename);
      if (record) {
        res.setHeader('Content-Type', record.mimeType);
      }
      res.setHeader('Content-Disposition', 'inline');

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  public static async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filename = String(req.params.filename);
      const filePath = path.resolve(appConfig.uploadDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`File "${filename}" not found on storage.`);
      }

      const record = FileDatabase.findByFilename(filename);
      const downloadName = record ? record.originalName : filename;

      res.download(filePath, downloadName);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const record = FileDatabase.findById(id);

      if (!record) {
        throw new NotFoundException(`File with ID "${id}" not found.`);
      }

      if (fs.existsSync(record.path)) {
        try {
          fs.unlinkSync(record.path);
        } catch (err) {
          console.warn(`Could not delete file on disk: ${record.path}`);
        }
      }

      FileDatabase.deleteById(id);

      ApiResponse.success(res, { id }, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async renameFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { newName } = req.body;

      if (!newName || typeof newName !== 'string' || !newName.trim()) {
        throw new BadRequestException('Property "newName" is required and cannot be empty.');
      }

      const record = FileDatabase.findById(id);
      if (!record) {
        throw new NotFoundException(`File with ID "${id}" not found.`);
      }

      // Preserve file extension if omitted
      const oldExt = path.extname(record.originalName);
      let sanitizedNewName = newName.trim();
      if (oldExt && !sanitizedNewName.toLowerCase().endsWith(oldExt.toLowerCase())) {
        sanitizedNewName += oldExt;
      }

      // Rename physical file on disk to maintain consistency
      const dir = path.dirname(record.path);
      const safeNewDiskName = `${Date.now()}-${id.substring(0, 8)}-${FileUtil.sanitizeFilename(sanitizedNewName)}`;
      const newDiskPath = path.resolve(dir, safeNewDiskName);

      if (fs.existsSync(record.path)) {
        try {
          fs.renameSync(record.path, newDiskPath);
          record.path = newDiskPath;
        } catch (err) {
          console.warn(`Could not rename physical file: ${record.path}`, err);
        }
      }

      // Update URLs and metadata
      const urls = FileUtil.getFileUrls(safeNewDiskName);
      record.originalName = sanitizedNewName;
      record.filename = safeNewDiskName;
      record.url = urls.url;
      record.downloadUrl = urls.downloadUrl;
      record.updatedAt = new Date().toISOString();

      FileDatabase.save(record);

      ApiResponse.success(res, { file: record }, 'File renamed successfully');
    } catch (error) {
      next(error);
    }
  }
}
