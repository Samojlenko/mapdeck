/**
 * PerfTracker — lightweight performance instrumentation for the point cloud pipeline.
 *
 * Usage:
 *   import { perfTracker } from "@core/shared/diagnostics/PerfTracker";
 *
 *   // Enable from browser console or in dev bootstrap:
 *   perfTracker.enable();
 *
 *   // Wrap synchronous work:
 *   perfTracker.start("color.elevation");
 *   const colors = this._colorsFromElevation(data.positions, data.bounds);
 *   perfTracker.end("color.elevation");
 *
 *   // Wrap async / concurrent work (returns a unique span id):
 *   const spanId = perfTracker.startSpan("node.load");
 *   await this._loadNode(node);
 *   perfTracker.endSpan(spanId, "node.load");
 *
 *   // Mark point-in-time events:
 *   perfTracker.mark("first-points-loaded", { pointCount: 128_450, nodeCount: 47 });
 *
 *   // Print report to console (returns structured data too):
 *   perfTracker.report();
 *
 *   // Reset all data:
 *   perfTracker.reset();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimingSample {
    duration: number;
    timestamp: number;
}

interface TimingStats {
    key: string;
    count: number;
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
    total: number;
    samples: TimingSample[];
}

interface Mark {
    name: string;
    time: number; // ms since tracker.enable()
    absoluteTime: number; // _now()
    meta: Record<string, unknown> | undefined;
}

interface MemorySnapshot {
    time: number;
    usedJSHeapSizeMB: number;
    totalJSHeapSizeMB: number;
}

export interface PerfReport {
    enabledAt: number;
    durationMs: number;
    timings: TimingStats[];
    marks: Mark[];
    memorySnapshots: MemorySnapshot[];
}

// ---------------------------------------------------------------------------
// PerfTracker
// ---------------------------------------------------------------------------

interface ExtendedPerformance extends Performance {
    memory?: {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    };
}

// eslint-disable-next-line no-underscore-dangle
const _now = (): number => window.performance.now();
// eslint-disable-next-line no-underscore-dangle
const _memory = (): ExtendedPerformance["memory"] | undefined =>
    (window.performance as ExtendedPerformance).memory;

export class PerfTracker {
    private _enabled = false;
    private _enabledAt = 0;

    // key → array of samples
    private _timings = new Map<string, TimingSample[]>();

    // spanId → { key, startTime }
    private _openSpans = new Map<string, { key: string; startTime: number }>();
    private _spanCounter = 0;

    private _marks: Mark[] = [];
    private _memorySnapshots: MemorySnapshot[] = [];

    // ---------------------------------------------------------------------------
    // Control
    // ---------------------------------------------------------------------------

    enable(): void {
        if (this._enabled) return;
        this._enabled = true;
        this._enabledAt = _now();
        this.mark("tracker-enabled");
        console.info("[PerfTracker] enabled");
    }

    disable(): void {
        this._enabled = false;
        console.info("[PerfTracker] disabled");
    }

    get isEnabled(): boolean {
        return this._enabled;
    }

    reset(): void {
        this._timings.clear();
        this._openSpans.clear();
        this._marks = [];
        this._memorySnapshots = [];
        this._spanCounter = 0;
        this._enabledAt = this._enabled ? _now() : 0;
        if (this._enabled) this.mark("tracker-reset");
    }

    // ---------------------------------------------------------------------------
    // Sequential timing (for synchronous or single-call async operations)
    // ---------------------------------------------------------------------------

    /**
     * Start a named timer. For operations that run one at a time.
     * Nested calls with the same key overwrite the start time.
     */
    start(key: string): void {
        if (!this._enabled) return;
        this._openSpans.set(`__seq__${key}`, { key, startTime: _now() });
    }

    /**
     * Stop the named timer and record the sample.
     * Returns elapsed ms, or 0 if tracker is disabled or start was never called.
     */
    end(key: string): number {
        if (!this._enabled) return 0;
        const spanKey = `__seq__${key}`;
        const span = this._openSpans.get(spanKey);
        if (!span) return 0;
        this._openSpans.delete(spanKey);
        return this._recordSample(span.key, span.startTime);
    }

    // ---------------------------------------------------------------------------
    // Concurrent timing (for parallel async operations like node loading)
    // ---------------------------------------------------------------------------

    /**
     * Start a concurrent span. Returns a unique spanId to pass to endSpan().
     * Multiple spans with the same aggregation key can be open simultaneously.
     */
    startSpan(aggregateKey: string): string {
        if (!this._enabled) return "";
        const spanId = `${aggregateKey}:${++this._spanCounter}`;
        this._openSpans.set(spanId, { key: aggregateKey, startTime: _now() });
        return spanId;
    }

    /**
     * Close a span opened by startSpan(). The duration is recorded under aggregateKey.
     * Returns elapsed ms, or 0 if tracker is disabled.
     */
    endSpan(spanId: string, aggregateKey: string): number {
        if (!this._enabled || !spanId) return 0;
        const span = this._openSpans.get(spanId);
        if (!span) return 0;
        this._openSpans.delete(spanId);
        return this._recordSample(aggregateKey, span.startTime);
    }

    // ---------------------------------------------------------------------------
    // Marks
    // ---------------------------------------------------------------------------

    mark(name: string, meta?: Record<string, unknown>): void {
        if (!this._enabled) return;
        const now = _now();
        this._marks.push({
            name,
            time: now - this._enabledAt,
            absoluteTime: now,
            meta,
        });
    }

    // ---------------------------------------------------------------------------
    // Memory snapshots (Chrome/Edge only — no-ops elsewhere)
    // ---------------------------------------------------------------------------

    snapshotMemory(label?: string): void {
        if (!this._enabled) return;
        const mem = _memory();
        if (!mem) return;
        this._memorySnapshots.push({
            time: _now() - this._enabledAt,
            usedJSHeapSizeMB: mem.usedJSHeapSize / 1_048_576,
            totalJSHeapSizeMB: mem.totalJSHeapSize / 1_048_576,
        });
        if (label) {
            this.mark(`memory:${label}`, {
                usedMB: (mem.usedJSHeapSize / 1_048_576).toFixed(1),
            });
        }
    }

    // ---------------------------------------------------------------------------
    // Report
    // ---------------------------------------------------------------------------

    report(): PerfReport {
        const timingStats = this._computeStats();
        const now = _now();

        const report: PerfReport = {
            enabledAt: this._enabledAt,
            durationMs: now - this._enabledAt,
            timings: timingStats,
            marks: [...this._marks],
            memorySnapshots: [...this._memorySnapshots],
        };

        this._printReport(report);
        return report;
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private _recordSample(key: string, startTime: number): number {
        const duration = _now() - startTime;
        const samples = this._timings.get(key) ?? [];
        samples.push({ duration, timestamp: _now() - this._enabledAt });
        this._timings.set(key, samples);
        return duration;
    }

    private _computeStats(): TimingStats[] {
        const stats: TimingStats[] = [];

        for (const [key, samples] of this._timings.entries()) {
            const durations = samples
                .map((s) => s.duration)
                .sort((a, b) => a - b);
            const total = durations.reduce((s, v) => s + v, 0);
            const count = durations.length;

            stats.push({
                key,
                count,
                min: durations[0] ?? 0,
                max: durations[count - 1] ?? 0,
                mean: total / count,
                p50: this._percentile(durations, 0.5),
                p95: this._percentile(durations, 0.95),
                p99: this._percentile(durations, 0.99),
                total,
                samples,
            });
        }

        // Sort by total time descending (biggest bottlenecks first)
        return stats.sort((a, b) => b.total - a.total);
    }

    private _percentile(sorted: number[], p: number): number {
        if (sorted.length === 0) return 0;
        const idx = Math.floor(sorted.length * p);
        return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
    }

    private _printReport(report: PerfReport): void {
        const pad = (s: string | number, n: number, right = false): string => {
            const str = typeof s === "number" ? this._fmt(s) : s;
            return right ? str.padStart(n) : str.padEnd(n);
        };

        const header = [
            pad("Operation", 32),
            pad("count", 7, true),
            pad("min", 9, true),
            pad("mean", 9, true),
            pad("p95", 9, true),
            pad("p99", 9, true),
            pad("total", 10, true),
        ].join("  ");

        const separator = "─".repeat(header.length);
        const rows = report.timings.map((s) =>
            [
                pad(s.key, 32),
                pad(s.count, 7, true),
                pad(s.min, 9, true),
                pad(s.mean, 9, true),
                pad(s.p95, 9, true),
                pad(s.p99, 9, true),
                pad(s.total, 10, true),
            ].join("  "),
        );

        const markLines = report.marks
            .filter(
                (m) =>
                    m.name !== "tracker-enabled" && m.name !== "tracker-reset",
            )
            .map((m) => {
                const meta = m.meta
                    ? "  " +
                      Object.entries(m.meta)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")
                    : "";
                return `  +${m.time.toFixed(0).padStart(7)}ms  [MARK] ${m.name}${meta}`;
            });

        console.group(
            `%c⏱ PerfTracker Report  (${(report.durationMs / 1000).toFixed(2)}s total)`,
            "font-weight:bold;font-size:13px",
        );
        console.log(`\n${header}\n${separator}`);
        rows.forEach((r) => console.log(r));

        if (markLines.length) {
            console.log(`\n${separator}\nTimeline:\n${markLines.join("\n")}`);
        }

        if (report.memorySnapshots.length) {
            const mem = report.memorySnapshots;
            const last = mem[mem.length - 1]!;
            console.log(
                `\nMemory (last snapshot):  used=${last.usedJSHeapSizeMB.toFixed(1)}MB  total=${last.totalJSHeapSizeMB.toFixed(1)}MB`,
            );
        }

        console.groupEnd();
    }

    /** Format ms value for console table: "1842ms", "34.2ms", "0.08ms" */
    private _fmt(ms: number): string {
        if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s `;
        if (ms >= 10) return `${ms.toFixed(1)}ms`;
        return `${ms.toFixed(2)}ms`;
    }
}

// ---------------------------------------------------------------------------
// Singleton — one import, one instance, accessible from browser console:
//   window.__perfTracker.enable()
//   window.__perfTracker.report()
// ---------------------------------------------------------------------------

export const perfTracker = new PerfTracker();

if (typeof window !== "undefined") {
    // eslint-disable-next-line no-underscore-dangle
    (window as unknown as Record<string, unknown>).__perfTracker = perfTracker;
}
