export function buildDownloadFilename( name: string = 'PMS', prefix: string, fileType: string = 'pdf'): string {
    const now     = new Date();
    const pad     = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${name}_${prefix}_${dateStr}_${timeStr}.${fileType}`;
}
