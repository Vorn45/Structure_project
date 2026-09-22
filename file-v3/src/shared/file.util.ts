import path from 'path';
import { appConfig } from '../configs/app.config';

export class FileUtil {
  public static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  public static sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${base}${ext}`.toLowerCase();
  }

  public static isAllowedMimeType(mimeType: string): boolean {
    if (!appConfig.allowedMimeTypes || appConfig.allowedMimeTypes.length === 0) {
      return true;
    }
    return appConfig.allowedMimeTypes.includes(mimeType.toLowerCase());
  }

  public static getFileUrls(filename: string) {
    const baseUrl = appConfig.appUrl.replace(/\/+$/, '');
    return {
      url: `${baseUrl}/api/v1/files/view/${filename}`,
      downloadUrl: `${baseUrl}/api/v1/files/download/${filename}`,
      staticUrl: `${baseUrl}/uploads/${filename}`,
    };
  }
}
