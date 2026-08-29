export enum FolderEnum {
    AVATAR              = 'avatar',
    ACTIVITY_ATTACHMENT = 'activity_url',
}

export enum FileTypeEnum {
    SAMPLE  = "sample",
    PDF     = "pdf",
    XLSX    = "xlsx",
}

export const FileContentTypeEnum = {
    [FileTypeEnum.PDF]: 'application/pdf',
    [FileTypeEnum.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export enum MimeTypeEnum {
  PDF   = 'application/pdf',
  PNG   = 'image/png',
  JPEG  = 'image/jpeg',
}
