// ===========================================================================>> Core Library
import { BadRequestException } from '@nestjs/common';

// ===========================================================================>> Third Party Library
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// ===========================================================================>> Custom Library
// > Local
import { appConfig } from 'src/app.config';

// ======================================= >> Code Starts Here << ========================== //
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

const DOCUMENT_EXTENSIONS = new Set([
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
    'zip', 'rar', '7z',
]);

// Extensions with no reliable magic-byte signature — content sniffing is skipped for these.
const SIGNATURE_LESS_EXTENSIONS = new Set(['txt', 'csv', 'svg']);

// file-type detects legacy MS Office (doc/xls/ppt) as generic 'cfb' and OOXML
// (docx/xlsx/pptx) as 'zip' — both are container formats it can't disambiguate further.
const EXTENSION_ALIASES: Record<string, Set<string>> = {
    doc: new Set(['cfb']),
    xls: new Set(['cfb']),
    ppt: new Set(['cfb']),
    docx: new Set(['zip']),
    xlsx: new Set(['zip']),
    pptx: new Set(['zip']),
    zip: new Set(['zip']),
    jpg: new Set(['jpg', 'jpeg']),
    jpeg: new Set(['jpg', 'jpeg']),
};

export type UploadKind = 'image' | 'document';

function allowedExtensionsFor(kind: UploadKind): Set<string> {
    return kind === 'image' ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
}

export function isDeclaredExtensionAllowed(originalname: string, kind: UploadKind): string | undefined {
    const extension = originalname.split('.').pop()?.toLowerCase();
    return extension && allowedExtensionsFor(kind).has(extension) ? extension : undefined;
}

const CONTENT_CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('File content check timed out')), ms);
        promise.then(
            (value) => { clearTimeout(timer); resolve(value); },
            (error) => { clearTimeout(timer); reject(error); },
        );
    });
}

// Matches the keyword only where PDF generators actually place it: as the value of a
// dictionary's /S (action subtype) or /Type key — e.g. `/S/JavaScript`, `/S /Launch`,
// `/Type/EmbeddedFile`. A bare `/OpenAction` or `/AA` key merely *points to* an action
// dictionary elsewhere, so those keys are intentionally not matched on their own; the
// actual danger is what the pointed-to dictionary's /S resolves to, which this still
// catches. Anchoring on /S and /Type avoids flagging the keyword when it shows up as
// plain text or metadata rather than as a real object/action declaration.
const PDF_ACTIVE_CONTENT_PATTERN = /\/(?:S|Type)\s*\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia)\b/;

/** Rejects PDFs that carry JavaScript, auto-launch actions, or embedded/rich-media objects. */
function isPdfFreeOfActiveContent(buffer: Buffer): boolean {
    // Scanned as raw bytes (not just uncompressed streams) since these keywords appear
    // in the PDF's object dictionaries, which are stored uncompressed.
    return !PDF_ACTIVE_CONTENT_PATTERN.test(buffer.toString('latin1'));
}

/** True if `detectedExt` (the sniffed magic-byte type) is a legitimate match for `extension`. */
function signatureMatchesExtension(detectedExt: string, extension: string): boolean {
    const allowedSignatures = EXTENSION_ALIASES[extension] ?? new Set([extension]);
    return allowedSignatures.has(detectedExt);
}

/**
 * Verifies a file's actual content (magic bytes) matches its declared extension. When
 * `kind` is given, a mismatch is still accepted as long as the *actual* content is itself
 * one of the extensions allowed for that kind — e.g. a PNG saved with a `.jpg` name is a
 * real image and passes, but a renamed `.exe` still doesn't, since "exe" isn't an allowed
 * extension for any kind. This lets mislabeled-but-genuine files through without weakening
 * the check against disguised/malicious content.
 */
export async function verifyFileContent(buffer: Buffer, extension: string, kind?: UploadKind): Promise<boolean> {
    if (SIGNATURE_LESS_EXTENSIONS.has(extension)) return true;

    let detected: { ext: string } | undefined;
    try {
        const { fileTypeFromBuffer } = await import('file-type');
        detected = await withTimeout(fileTypeFromBuffer(buffer), CONTENT_CHECK_TIMEOUT_MS);
    } catch {
        return false;
    }
    if (!detected) return false;

    let matchedExtension: string | undefined;
    if (signatureMatchesExtension(detected.ext, extension)) {
        matchedExtension = extension;
    } else if (kind) {
        // Fall back to whatever declared extension the real content actually corresponds
        // to, as long as that extension is itself allowed for this upload kind.
        matchedExtension = [...allowedExtensionsFor(kind)].find((candidate) =>
            signatureMatchesExtension(detected.ext, candidate),
        );
    }
    if (!matchedExtension) return false;

    if (matchedExtension === 'pdf' && !isPdfFreeOfActiveContent(buffer)) return false;

    return true;
}

/** Declared-extension + magic-byte content check, for use outside multer (e.g. base64 uploads). */
export async function assertUploadSafe(
    buffer: Buffer,
    originalname: string,
    kind: UploadKind,
): Promise<void> {
    const maxBytes = appConfig.FILE.UPLOAD_MAX_SIZE_MB * 1024 * 1024;
    if (buffer.length > maxBytes)
        throw new BadRequestException(
            `File "${originalname}" exceeds the maximum allowed size of ${appConfig.FILE.UPLOAD_MAX_SIZE_MB}MB`,
        );

    const extension = isDeclaredExtensionAllowed(originalname, kind);
    if (!extension) throw new BadRequestException('This file type is not allowed');

    const contentMatches = await verifyFileContent(buffer, extension, kind);
    if (!contentMatches)
        throw new BadRequestException(
            `File "${originalname}" does not match its declared file type`,
        );
}

function buildUploadOptions(kind: UploadKind): MulterOptions {
    return {
        limits: {
            fileSize: appConfig.FILE.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
            files: appConfig.FILE.UPLOAD_MAX_FILES,
        },
        fileFilter: (_req, file, callback) => {
            const extension = isDeclaredExtensionAllowed(file.originalname, kind);

            if (!extension)
                return callback(new BadRequestException('This file type is not allowed'), false);

            callback(null, true);
        },
    };
}

/** Multer options for image-only uploads (avatars, logos, icons, cover images). */
export const IMAGE_UPLOAD_OPTIONS: MulterOptions = buildUploadOptions('image');

/** Multer options for document uploads (also accepts images — attachments, chat files). */
export const DOCUMENT_UPLOAD_OPTIONS: MulterOptions = buildUploadOptions('document');
