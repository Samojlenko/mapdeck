import { downloadFile } from "@core/shared";
import { logger } from "@core/shared/diagnostics/logger";

export function openReport(url: string, label: string): void {
    if (!url) {
        logger.warn(`Report "${label}" has no URL`);
        return;
    }
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
        newWindow.opener = null;
    }
}

export function downloadReport(url: string, label: string): void {
    if (!url) {
        logger.warn(`Report "${label}" has no URL`);
        return;
    }
    downloadFile(url, label);
}
