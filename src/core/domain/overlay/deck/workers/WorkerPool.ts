// mapdeck/src/core/overlay/deck/workers/WorkerPool.ts
// Pool of web workers for parallel point cloud processing.
// Distributes work across multiple threads to avoid UI freezes.
// Workers are created by a factory function so Vite can statically
// analyze the new URL(...import.meta.url) pattern at the call site.

import { logger } from "@core/shared/diagnostics/logger";

type PendingRequest = {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
};

type QueuedItem = {
    data: unknown;
    transfer: Transferable[];
    requestId: string;
};

export class WorkerPool {
    private workers: Worker[] = [];
    private queue: QueuedItem[] = [];
    private pending = new Map<string, PendingRequest>();
    private workerBusy: boolean[] = [];
    private requestCounter = 0;

    constructor(
        createWorker: () => Worker,
        private poolSize: number,
    ) {
        for (let i = 0; i < poolSize; i++) {
            const w = createWorker();
            w.onmessage = (e) => this._onResult(i, e.data);
            w.onerror = (e) => this._onError(i, e);
            this.workers.push(w);
            this.workerBusy.push(false);
        }
    }

    get size(): number {
        return this.poolSize;
    }

    get activeRequests(): number {
        return this.workerBusy.filter((busy) => busy).length;
    }

    post<TReq, TRes>(data: TReq, transfer: Transferable[]): Promise<TRes> {
        const requestId = String(++this.requestCounter);
        (data as Record<string, unknown>).requestId = requestId;

        return new Promise<TRes>((resolve, reject) => {
            this.pending.set(requestId, {
                resolve: resolve as (r: unknown) => void,
                reject,
            });

            const freeIdx = this.workerBusy.findIndex((busy) => !busy);
            if (freeIdx !== -1) {
                this._dispatch(freeIdx, data, transfer);
            } else {
                this.queue.push({ data, transfer, requestId });
            }
        });
    }

    private _dispatch(
        workerIdx: number,
        data: unknown,
        transfer: Transferable[],
    ): void {
        this.workerBusy[workerIdx] = true;
        this.workers[workerIdx]!.postMessage(data, transfer);
    }

    private _onResult(workerIdx: number, result: { requestId: string }): void {
        const pending = this.pending.get(result.requestId);
        this.pending.delete(result.requestId);
        this.workerBusy[workerIdx] = false;
        if (pending) {
            pending.resolve(result);
        }
        this._drainQueue(workerIdx);
    }

    private _onError(workerIdx: number, e: ErrorEvent): void {
        logger.error(`WorkerPool: worker ${workerIdx} error`, e.message);
        this.workerBusy[workerIdx] = false;
        this._drainQueue(workerIdx);
    }

    private _drainQueue(workerIdx: number): void {
        const next = this.queue.shift();
        if (next) {
            this._dispatch(workerIdx, next.data, next.transfer);
        }
    }

    dispose(): void {
        for (const w of this.workers) {
            w.terminate();
        }
        this.workers = [];
        this.pending.clear();
        this.queue = [];
        this.workerBusy = [];
    }
}
