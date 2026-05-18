import React from "react";
import styles from "./MeasurementPanel.module.css";

export interface Segment {
    /** Left-side label (e.g. "Point 1 → 2") */
    label: string;
    /** Right-side formatted value (e.g. "12.3 m") */
    value: string;
    /** Optional sub-rows (e.g. horizontal / vertical breakdown) */
    details?: SegmentDetail[];
}

export interface SegmentDetail {
    label: string;
    value: string;
}

export interface SegmentsListProps {
    /** Section title */
    title: string;
    /** Ordered list of segments */
    segments: Segment[];
}

/**
 * Scrollable list of measurement segments with optional detail rows.
 * Used by ruler-3d and area-measure to display per-edge distances.
 */
export const SegmentsList: React.FC<SegmentsListProps> = ({
    title,
    segments,
}) => (
    <div className={styles.segments}>
        <div className={styles.segmentsTitle}>{title}</div>
        <div className={styles.segmentsList}>
            {segments.map((segment, index) => (
                <div key={index} className={styles.segmentItem}>
                    <div className={styles.segmentLabel}>{segment.label}</div>
                    <div className={styles.segmentValue}>{segment.value}</div>
                    {segment.details && segment.details.length > 0 && (
                        <div className={styles.segmentComponents}>
                            {segment.details.map((detail, di) => (
                                <div
                                    key={di}
                                    className={styles.segmentComponent}
                                >
                                    <span>{detail.label}</span>
                                    <span>{detail.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export default SegmentsList;
