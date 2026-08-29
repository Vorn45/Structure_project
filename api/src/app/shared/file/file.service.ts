// ===========================================================================>> Core Library
import { HttpService }                                                                                          from '@nestjs/axios';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException, } from '@nestjs/common';
import { firstValueFrom }                                                                                       from 'rxjs';

// ===========================================================================>> Third Party Library
import { EntityManager } from 'typeorm';

// ===========================================================================>> Custom Library
// > Local
import { appConfig }        from 'src/app.config';
import { File }             from 'src/app/model/file/file.entity';
import { assertUploadSafe, UploadKind } from 'src/app/shared/file/file-upload.util';

// ======================================= >> Code Starts Here << ========================== //
export interface UploadedFilePayload {
    name?: string;
    uri?: string;
    mimetype?: string;
    size?: number;
}

type FileFolderPayload = {
    id?: number;
    name?: string;
};

function fixMultipartFilename(name: string): string {
    if (!name || !/[\x80-\xff]/.test(name)) return name;
    if (/[^\x00-\xff]/.test(name)) return name;

    const fixed = Buffer.from(name, 'latin1').toString('utf8').normalize('NFC');
    return fixed.includes('�') ? name : fixed;
}

type Base64ImagePayload = {
    buffer: Buffer;
    mimetype: string;
    extension: string;
};

@Injectable()
export class FileService {
    constructor(private readonly _httpService: HttpService) {}

    private getAuthHeaders(): Record<string, string> {
        const username = process.env.FILE_USERNAME?.trim() ?? '';
        const password = process.env.FILE_PASSWORD?.trim() ?? '';

        return {
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        };
    }

    private getFileApiBaseUrl(): string {
        const baseUrl = process.env.FILE_BASE_URL?.trim() ?? '';
        if (!baseUrl) return '';

        const withoutTrailingSlash = baseUrl.replace(/\/+$/, '');
        const apiHostUrl = withoutTrailingSlash.replace(
            '://file-v4.',
            '://file-v4-api.',
        );

        return apiHostUrl.endsWith('/api') ? apiHostUrl : `${apiHostUrl}/api`;
    }

    private async authorizedRequest<T>(
        request: (headers: Record<string, string>) => Promise<T>,
    ): Promise<T> {
        return await request(this.getAuthHeaders());
    }

    private normalizeFileUri(uri?: string | null): string | null {
        if (!uri) return null;
        if (/^https?:\/\//i.test(uri)) return uri;
        return uri.replace(/^\/+/, '');
    }
    private extensionOf(
        name?: string | null,
        uri?: string | null,
        mimetype?: string | null,
    ): string | null {
        const fromName = /\.([a-z0-9]+)$/i.exec(name ?? '')?.[1];
        if (fromName) return fromName.toLowerCase();
        const fromUri = /\.([a-z0-9]+)$/i.exec(uri ?? '')?.[1];
        if (fromUri) return fromUri.toLowerCase();
        const sub = (mimetype ?? '').split('/')[1]?.split(';')[0]?.trim();
        if (sub) return sub.replace('jpeg', 'jpg').toLowerCase();
        return null;
    }

    private parseBase64Image(base64: string): Base64ImagePayload {
        const matches = base64.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
        );
        if (!matches?.[1] || !matches?.[2]) {
            throw new BadRequestException('Invalid base64 image');
        }

        const mimetype = matches[1];
        const extension =
            mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

        return {
            buffer: Buffer.from(matches[2], 'base64'),
            mimetype,
            extension,
        };
    }

    private getUploadProjectConfig(): { projectId: string; folderId: string } {
        const projectId =
            process.env.FILE_UPLOAD_PROJECT_ID?.trim() ||
            process.env.FILE_PROJECT_ID?.trim() ||
            '';
        const folderId =
            process.env.FILE_UPLOAD_FOLDER_ID?.trim() ||
            process.env.FILE_FOLDER_ID?.trim() ||
            '';

        return { projectId, folderId };
    }

    private getFileKey(): string {
        return process.env.FILE_KEY?.trim().replace(/^['"]|['"]$/g, '') ?? '';
    }

    private getFolderId(folder?: FileFolderPayload | null): number | null {
        if (!folder?.id) return null;

        const id = Number(folder.id);
        return Number.isNaN(id) ? null : id;
    }

    private async findChildFolder(
        projectId: string,
        parentId: number,
        name: string,
    ): Promise<FileFolderPayload | null> {
        const fileBaseUrl = this.getFileApiBaseUrl();

        try {
            const response = await this.authorizedRequest((headers) =>
                firstValueFrom(
                    this._httpService.get(
                        `${fileBaseUrl}/projects/folder/static/child`,
                        {
                            headers,
                            params: {
                                project_id: projectId,
                                parent_id: parentId,
                            },
                            timeout: 30000,
                        },
                    ),
                ),
            );
            const folders = response.data?.data?.folders || [];

            return (
                folders.find(
                    (folder: FileFolderPayload) => folder.name === name,
                ) ?? null
            );
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new InternalServerErrorException(
                msg
                    ? `Unable to read file folder: ${msg}`
                    : 'Unable to read file folder',
            );
        }
    }

    private async createFolder(
        projectId: string,
        parentId: number,
        name: string,
    ): Promise<FileFolderPayload> {
        const fileBaseUrl = this.getFileApiBaseUrl();

        try {
            const response = await this.authorizedRequest((headers) =>
                firstValueFrom(
                    this._httpService.post(
                        `${fileBaseUrl}/projects/folder`,
                        { name, project_id: projectId, parent_id: parentId },
                        { headers, timeout: 30000 },
                    ),
                ),
            );
            const folder = response.data?.data;
            if (!this.getFolderId(folder))
                throw new Error('Created folder response is invalid');

            return folder;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new InternalServerErrorException(
                msg
                    ? `Unable to create file folder: ${msg}`
                    : 'Unable to create file folder',
            );
        }
    }

    public async getOrCreateUploadFolder(
        folderNames: string[],
    ): Promise<{ projectId: string; folderId: number }> {
        const { projectId, folderId } = this.getUploadProjectConfig();
        let parentId = Number(folderId);

        if (Number.isNaN(parentId)) {
            throw new InternalServerErrorException(
                'File upload folder is invalid',
            );
        }

        for (const name of folderNames) {
            const folderName = name?.trim();
            if (!folderName) continue;

            const existingFolder = await this.findChildFolder(
                projectId,
                parentId,
                folderName,
            );
            const folder =
                existingFolder ??
                (await this.createFolder(projectId, parentId, folderName));
            const folderId = this.getFolderId(folder);
            if (!folderId)
                throw new InternalServerErrorException(
                    'File folder response is invalid',
                );
            parentId = folderId;
        }

        return { projectId, folderId: parentId };
    }

    public async listUploadFolders(
        folderId?: number | null,
    ): Promise<FileFolderPayload[]> {
        const { projectId, folderId: rootFolderId } =
            this.getUploadProjectConfig();
        const parentId = folderId ?? Number(rootFolderId);

        if (Number.isNaN(parentId)) {
            throw new InternalServerErrorException(
                'File upload folder is invalid',
            );
        }

        const fileBaseUrl = this.getFileApiBaseUrl();

        try {
            const response = await firstValueFrom(
                this._httpService.get(
                    `${fileBaseUrl}/projects/folder/static/child`,
                    {
                        headers: this.getAuthHeaders(),
                        params: { project_id: projectId, parent_id: parentId },
                        timeout: 30000,
                    },
                ),
            );

            return response.data?.data?.folders || [];
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new InternalServerErrorException(
                msg
                    ? `Unable to read file folder: ${msg}`
                    : 'Unable to read file folder',
            );
        }
    }

    public async createUploadFolder(
        name: string,
        parentFolderId?: number | null,
    ): Promise<FileFolderPayload> {
        const { projectId, folderId } = this.getUploadProjectConfig();
        const parentId = parentFolderId ?? Number(folderId);

        if (Number.isNaN(parentId)) {
            throw new InternalServerErrorException(
                'File upload folder is invalid',
            );
        }

        return await this.createFolder(projectId, parentId, name);
    }

    public async uploadBase64Image(
        folder = '',
        base64 = '',
    ): Promise<UploadedFilePayload> {
        const fileBaseUrl = this.getFileApiBaseUrl();

        if (!fileBaseUrl || !process.env.FILE_PASSWORD) {
            throw new InternalServerErrorException(
                'File service is not configured',
            );
        }

        // Validate before sending the request.
        const parsed = this.parseBase64Image(base64);
        await assertUploadSafe(parsed.buffer, `upload.${parsed.extension}`, 'image');

        try {
            const key = this.getFileKey();
            const response = await this.authorizedRequest((headers) =>
                firstValueFrom(
                    this._httpService.post(
                        `${fileBaseUrl}/file/upload-base64`,
                        {
                            folder,
                            image: base64,
                            ...(key ? { key } : {}),
                        },
                        { headers, timeout: 30000 },
                    ),
                ),
            );
            const uploadedFile = response.data?.data;
            if (!uploadedFile?.uri)
                throw new Error('Uploaded file response is invalid');

            return {
                name: uploadedFile.name,
                uri: this.normalizeFileUri(uploadedFile.uri),
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                throw new UnauthorizedException(
                    msg
                        ? `File upload authorization failed: ${msg}`
                        : 'File upload authorization failed',
                );
            }

            throw new InternalServerErrorException(
                msg ? `Unable to upload file: ${msg}` : 'Unable to upload file',
            );
        }
    }

    public async uploadMultipartFile(
        folder = '',
        file?: {
            originalname?: string;
            mimetype?: string;
            size?: number;
            buffer?: Buffer;
        },
        folderId?: number,
        kind: UploadKind = 'document',
    ): Promise<UploadedFilePayload> {
        if (!file?.buffer?.length)
            throw new BadRequestException('File is empty');
        if (file.originalname)
            file.originalname = fixMultipartFilename(file.originalname);

        await assertUploadSafe(file.buffer, file.originalname || 'upload', kind);

        const fileBaseUrl = this.getFileApiBaseUrl();

        if (!fileBaseUrl || !process.env.FILE_PASSWORD) {
            throw new InternalServerErrorException(
                'File service is not configured',
            );
        }

        const key = this.getFileKey();
        const filename =
            file.originalname || `${folder || 'file'}-${Date.now()}`;
        const fileBytes = file.buffer.buffer.slice(
            file.buffer.byteOffset,
            file.buffer.byteOffset + file.buffer.byteLength,
        ) as ArrayBuffer;

        try {
            // FormData is rebuilt per attempt (see authorizedRequest): a streamed
            // multipart body cannot be reused for the retry.
            const response = await this.authorizedRequest((headers) => {
                const formData = new FormData();
                formData.append('folder', folder);
                if (key) formData.append('key', key);
                if (folderId) formData.append('folder_id', folderId.toString());
                formData.append(
                    'file',
                    new Blob([fileBytes], {
                        type: file.mimetype || 'application/octet-stream',
                    }),
                    filename,
                );
                return firstValueFrom(
                    this._httpService.post(
                        `${fileBaseUrl}/file/upload-single`,
                        formData,
                        { headers, timeout: 30000 },
                    ),
                );
            });
            const uploadedFile = response.data?.data;
            if (!uploadedFile?.uri)
                throw new Error('Uploaded file response is invalid');

            return {
                name: filename,
                uri: this.normalizeFileUri(uploadedFile.uri),
                mimetype: uploadedFile.mimetype ?? file.mimetype,
                size: uploadedFile.size ?? file.size ?? file.buffer.length,
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
                throw new UnauthorizedException(
                    msg
                        ? `File upload authorization failed: ${msg}`
                        : 'File upload authorization failed',
                );
            }

            throw new InternalServerErrorException(
                msg ? `Unable to upload file: ${msg}` : 'Unable to upload file',
            );
        }
    }

    public async storeFile(
        manager: EntityManager,
        file: UploadedFilePayload,
        options?: {
            ref_table?: string;
            ref_id?: string;
            folder_id?: number;
            created_by?: string;
            updated_by?: string;
            fallback_title?: string;
            fallback_mimetype?: string;
            fallback_size?: number;
        },
    ): Promise<File | null> {
        if (!file?.uri) return null;

        const title = file.name ?? options?.fallback_title ?? 'uploaded-file';
        const mimetype = file.mimetype ?? options?.fallback_mimetype ?? null;
        const extension = this.extensionOf(title, file.uri, mimetype);

        return await manager.getRepository(File).save(
            manager.getRepository(File).create({
                title,
                extention: extension,
                type: mimetype,
                size: file.size ?? options?.fallback_size ?? 0,
                ref_table: options?.ref_table ?? null,
                ref_id: options?.ref_id ?? null,
                folder_id: options?.folder_id ?? null,
                uri: this.normalizeFileUri(file.uri),
                file_domain: appConfig.FILE.BASE_URL,
                created_by: options?.created_by ?? null,
                updated_by: options?.updated_by ?? null,
            }),
        );
    }
}
