
export function saveFile(fileName: string = '', file_base64: string = '', type: string = 'PDF') {

    if(!isBase64(file_base64)) return '';

    // Decode the Base64 string
    const binaryData = atob(file_base64);

    // Convert the binary data to a Blob
    const arrayBuffer = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: type == 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Create a URL for the Blob and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + getFormattedDateTime(); // Set the desired file name
    document.body.appendChild(a);
    a.click(); // Trigger the download
    document.body.removeChild(a); // Clean up
    window.URL.revokeObjectURL(url); // Free memory

}


function getFormattedDateTime(): string {
    const now = new Date();

    const year      = now.getFullYear();
    const month     = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day       = String(now.getDate()).padStart(2, '0');
    const hours     = String(now.getHours()).padStart(2, '0');
    const minutes   = String(now.getMinutes()).padStart(2, '0');
    const seconds   = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function isBase64(str: string): boolean {
    if (!str || typeof str !== 'string') {
        return false;
    }

    // Base64 regex pattern
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    // Check if the string length is a multiple of 4
    if (str.length % 4 !== 0) {
        return false;
    }

    // Test the string against the regex
    return base64Regex.test(str);
}
