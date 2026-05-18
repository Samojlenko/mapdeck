import { makeAutoObservable, runInAction } from "mobx";
import type { STACEntity, STACFeatureCollection } from "../types";

interface CacheEntry {
    entity: STACEntity;
    timestamp: number;
    ttl: number;
}

export class STACCache {
    private entries = new Map<string, CacheEntry>();
    private maxSize: number;

    constructor(config?: { maxSize?: number; defaultTtl?: number }) {
        this.maxSize = config?.maxSize ?? 100;
        makeAutoObservable(this);
    }

    store(entity: STACEntity, ttl?: number): void {
        const key = this.getEntityKey(entity);
        const entry: CacheEntry = {
            entity,
            timestamp: Date.now(),
            ttl: ttl ?? 5 * 60 * 1000, // Default 5 minutes
        };

        runInAction(() => {
            if (this.entries.size >= this.maxSize && !this.entries.has(key)) {
                this.evictOldest();
            }

            this.entries.set(key, entry);
        });
    }

    get<T extends STACEntity>(type: string, id: string): T | undefined {
        const key = `${type}:${id}`;
        const entry = this.entries.get(key);

        if (!entry) {
            return undefined;
        }

        if (Date.now() - entry.timestamp > entry.ttl) {
            runInAction(() => {
                this.entries.delete(key);
            });
            return undefined;
        }

        return entry.entity as T;
    }

    has(entity: STACEntity): boolean {
        const key = this.getEntityKey(entity);
        const entry = this.entries.get(key);

        if (!entry) return false;

        if (Date.now() - entry.timestamp > entry.ttl) {
            runInAction(() => {
                this.entries.delete(key);
            });
            return false;
        }

        return true;
    }

    clear(): void {
        runInAction(() => {
            this.entries.clear();
        });
    }

    getStats(): { size: number; maxSize: number } {
        return {
            size: this.entries.size,
            maxSize: this.maxSize,
        };
    }

    private getEntityKey(entity: STACEntity): string {
        if (entity.type === "FeatureCollection") {
            const fc = entity as STACFeatureCollection;
            const featuresCount = fc.features.length;
            const firstFeatureId =
                featuresCount > 0 ? fc.features[0]!.id : "empty";
            return `FeatureCollection:${firstFeatureId}:${featuresCount}`;
        }
        return `${entity.type}:${entity.id}`;
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.entries.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.entries.delete(oldestKey);
        }
    }
}
