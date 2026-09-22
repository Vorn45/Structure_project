export interface IFileRecord {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  formattedSize: string;
  path: string;
  url: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFileUploadResponse {
  file: IFileRecord;
}

export interface IMultipleFileUploadResponse {
  files: IFileRecord[];
  total: number;
}
