import React from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "@core/framework/store";
import { formatDict } from "@core/framework/i18n";
import { Icon } from "@core/ui/components";
import { openReport, downloadReport } from "../utils";
import { LAYER_TREE_ID } from "..";
import styles from "./ReportDownloads.module.css";

export interface ReportDownloadsProps {
    nodeId: string;
}

/**
 * Renders download buttons for all download capabilities of a node.
 */
export const ReportDownloads: (props: ReportDownloadsProps) => React.ReactNode =
    observer(({ nodeId }) => {
        const rootStore = useRootStore();
        const dict = rootStore.localeStore.t(LAYER_TREE_ID);
        const node = rootStore.treeStore.getNode(nodeId);

        if (!node) return null;

        const downloads = node.capabilities.downloads;
        if (downloads.length === 0) return null;

        return (
            <div className={styles.reportDownloadsContainer}>
                <span className={styles.reportLabel}>
                    {dict["label.reports"]}
                </span>
                <div className={styles.reportButtons}>
                    {downloads.map((download) => (
                        <div key={download.id} className={styles.reportRow}>
                            <button
                                className={styles.reportButton}
                                onClick={() =>
                                    openReport(download.sourceUrl, download.label)
                                }
                                title={formatDict(dict["aria.openReport"]!, {
                                    label: download.label,
                                })}
                            >
                                <span className={styles.reportButtonText}>
                                    {download.label}
                                </span>
                            </button>
                            <button
                                className={styles.downloadButton}
                                onClick={() =>
                                    downloadReport(download.sourceUrl, download.label)
                                }
                                title={formatDict(
                                    dict["aria.downloadReport"]!,
                                    { label: download.label },
                                )}
                            >
                                <Icon
                                    name="file-download"
                                    className={styles.downloadIcon ?? ""}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    });

export default ReportDownloads;
