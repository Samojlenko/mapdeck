/**
 * Triggers a file download by creating a temporary anchor element.
 */
export function downloadFile(url: string, filename: string): void {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}
