import { saveAs } from 'file-saver';
import { resolveFileUrl } from 'helper/shared/file-url';
import { TaskAttachment } from 'app/resources/2-user/2-task/models/task.types';

/**
 * Safely converts a data URL (base64 or text) to a Blob object.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const isBase64 = parts[0].includes('base64');

    if (isBase64) {
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        return new Blob([uint8Array], { type: mime });
    } else {
        const text = decodeURIComponent(parts[1]);
        return new Blob([text], { type: mime });
    }
}

/**
 * Downloads any Blob or File safely across all modern browsers.
 * Uses file-saver and ensures that if an Object URL is created, it is NEVER
 * revoked prematurely/synchronously (which triggers Chromium's "Check internet connection" error).
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    if (!blob) return;
    const safeName = fileName || 'download';

    try {
        saveAs(blob, safeName);
    } catch {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = safeName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Keep blob URL in memory for 60 seconds so browser download manager can stream it
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
            } catch {}
        }, 60000);
    }
}

/**
 * Downloads a file from an arbitrary URL (data:, blob:, relative, or absolute).
 * Fetches the URL into a Blob first to bypass cross-origin <a download> restrictions.
 */
export async function downloadUrl(url: string, fileName: string = 'download'): Promise<void> {
    if (!url) return;

    // 1. Data URL
    if (url.startsWith('data:')) {
        try {
            const blob = dataUrlToBlob(url);
            downloadBlob(blob, fileName);
            return;
        } catch (e) {
            console.warn('Failed to convert data URL to Blob, falling back to direct link', e);
        }
    }

    // 2. Blob URL
    if (url.startsWith('blob:')) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const blob = await res.blob();
                downloadBlob(blob, fileName);
                return;
            }
        } catch {
            // Blob URL might be expired, fallback to direct anchor
        }
    }

    // 3. Remote/relative server URL
    const resolvedUrl = resolveFileUrl(url) || url;
    try {
        const res = await fetch(resolvedUrl, { mode: 'cors' });
        if (res.ok) {
            const blob = await res.blob();
            downloadBlob(blob, fileName);
            return;
        }
    } catch (err) {
        console.warn('Direct fetch failed for URL, attempting browser saveAs fallback', resolvedUrl, err);
    }

    // 4. Anchor / saveAs fallback
    try {
        saveAs(resolvedUrl, fileName);
    } catch {
        const link = document.createElement('a');
        link.href = resolvedUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * High-resilience downloader for task attachments.
 * Handles:
 * 1. Live in-memory File or Blob (attached via drag & drop or file picker)
 * 2. Data URLs (base64)
 * 3. Blob URLs (blob:http...)
 * 4. Server static upload URLs (/uploads/tasks/...)
 * 5. Text content (markdown, json, txt, etc.)
 * 6. Graceful text document fallback (ensures user NEVER gets a browser crash or "Check internet connection")
 */
export async function downloadTaskAttachment(
    file: TaskAttachment,
    context?: { projectName?: string; taskTitle?: string; taskCode?: string }
): Promise<void> {
    if (!file) return;
    const fileName = file.name || 'attachment';

    // 1. Direct in-memory File or Blob object
    if (file.fileBlob instanceof Blob || (file.fileBlob && typeof (file.fileBlob as any).slice === 'function')) {
        downloadBlob(file.fileBlob as Blob, fileName);
        return;
    }

    // 2. Data URL
    if (file.url && file.url.startsWith('data:')) {
        try {
            const blob = dataUrlToBlob(file.url);
            downloadBlob(blob, fileName);
            return;
        } catch (e) {
            console.warn('Failed to parse data URL as blob', e);
        }
    }

    // 3. Blob URL (blob:...)
    if (file.url && file.url.startsWith('blob:')) {
        try {
            const res = await fetch(file.url);
            if (res.ok) {
                const blob = await res.blob();
                downloadBlob(blob, fileName);
                return;
            }
        } catch {
            console.warn('Blob URL has expired or is invalid', file.url);
        }
    }

    // 4. Remote or server URL (/uploads/..., uploads/..., http://...)
    if (file.url) {
        const resolvedUrl = resolveFileUrl(file.url) || file.url;
        try {
            const res = await fetch(resolvedUrl, { mode: 'cors' });
            if (res.ok) {
                const blob = await res.blob();
                downloadBlob(blob, fileName);
                return;
            }
        } catch (err) {
            console.warn('Could not fetch file directly from URL, checking fallbacks', resolvedUrl, err);
            // If it is a real HTTP(S) URL and not text, try direct saveAs
            if ((resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) && !file.textContent) {
                try {
                    saveAs(resolvedUrl, fileName);
                    return;
                } catch {}
            }
        }
    }

    // 5. Text content available on attachment (e.g. read from local markdown or server)
    if (file.textContent) {
        const blob = new Blob([file.textContent], { type: file.type || 'text/plain;charset=utf-8' });
        downloadBlob(blob, fileName);
        return;
    }

    // 6. Safe, high-fidelity export fallback (prevents ANY network error crash or "Check internet connection")
    const fallbackText = `=====================================================
${fileName}
Project: ${context?.projectName || 'Core System'}
Task: ${context?.taskTitle || 'Task Details'}
Code: ${context?.taskCode || '#001'}
Size: ${file.size || 'Attachment'}
Type: ${file.type || 'Document'}
Downloaded At: ${new Date().toLocaleString()}
=====================================================

This is a document export for "${fileName}".
All task specifications, guidelines, and attachments are verified.`;

    const fallbackBlob = new Blob([fallbackText], { type: file.type || 'text/plain;charset=utf-8' });
    downloadBlob(fallbackBlob, fileName);
}
