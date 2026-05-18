import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";
import {
    BUFFER_SIZE,
    DEFAULT_CONTAINER_HEIGHT,
    PRELOAD_BUFFER_ROWS,
    ROW_HEIGHT,
} from "../constants";

interface UseVirtualWindowOptions {
    rowCount: number;
    totalRows?: number | undefined;
    fetchMore?:
        | ((count: number) => void)
        | ((count: number) => Promise<void>)
        | undefined;
    loading: boolean;
    pageSize?: number;
}

interface UseVirtualWindowResult {
    containerRef: RefObject<HTMLDivElement | null>;
    handleScroll: () => void;
    startIndex: number;
    endIndex: number;
    topPaddingHeight: number;
    bottomPaddingHeight: number;
}

/**
 * Manages virtual scroll state: tracks scroll position via a ResizeObserver +
 * scroll handler, computes the visible window indices, and triggers fetchMore
 * when the user scrolls near the end of loaded data.
 */
export function useVirtualWindow(
    options: UseVirtualWindowOptions,
): UseVirtualWindowResult {
    const { rowCount, totalRows, fetchMore, loading, pageSize } = options;
    const effectiveTotal = totalRows ?? rowCount;

    const containerRef = useRef<HTMLDivElement>(null);
    const containerHeightRef = useRef(DEFAULT_CONTAINER_HEIGHT);
    const isFetchingRef = useRef(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(
        DEFAULT_CONTAINER_HEIGHT,
    );
    const [fetchTrigger, setFetchTrigger] = useState(0);

    // Track container height via ResizeObserver without triggering re-renders
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const h = entry.contentRect.height;
                containerHeightRef.current = h;
                setContainerHeight(h);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // On scroll: read fresh height from ref, update state once
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        setScrollTop(el.scrollTop);
        setContainerHeight(containerHeightRef.current);
    }, []);

    // Trigger fetchMore when the visible window extends beyond loaded data.
    // Uses isFetchingRef to prevent duplicate calls during the gap between
    // fetchMore start and loading flag update from the store.
    // Uses raw useEffect (not useAsyncEffect) to control isFetchingRef reset
    // in cleanup when dependencies change and the previous fetch is cancelled.
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (cancelled) return;
            if (!fetchMore || loading || isFetchingRef.current) return;
            if (rowCount >= effectiveTotal) return;

            const visibleEndRow =
                Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) +
                PRELOAD_BUFFER_ROWS;
            const needMoreData = visibleEndRow > rowCount;

            if (!needMoreData) return;

            const minPage = pageSize ?? 50;
            const shortage = Math.max(minPage, visibleEndRow - rowCount);
            const count = Math.ceil(shortage / minPage) * minPage;

            isFetchingRef.current = true;
            try {
                await fetchMore(count);
            } finally {
                if (!cancelled) {
                    isFetchingRef.current = false;
                    setFetchTrigger((t) => t + 1);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
            isFetchingRef.current = false;
        };
    }, [
        scrollTop,
        rowCount,
        containerHeight,
        loading,
        fetchMore,
        pageSize,
        fetchTrigger,
    ]);

    const rawStart = Math.floor(scrollTop / ROW_HEIGHT);
    const startIndex = Math.max(0, rawStart - BUFFER_SIZE);
    const visibleCount =
        Math.ceil(containerHeight / ROW_HEIGHT) + 2 * BUFFER_SIZE;
    const endIndex = Math.min(effectiveTotal, startIndex + visibleCount);
    const topPaddingHeight = startIndex * ROW_HEIGHT;
    const bottomPaddingHeight =
        Math.max(0, effectiveTotal - endIndex) * ROW_HEIGHT;

    // Reset scroll position when total shrinks below current viewport
    // (e.g., filter applied while scrolled deep into the list).
    useEffect(() => {
        const el = containerRef.current;
        if (!el || effectiveTotal === 0) return;
        const totalHeight = effectiveTotal * ROW_HEIGHT;
        const maxScrollTop = Math.max(0, totalHeight - containerHeight);
        if (el.scrollTop > maxScrollTop) {
            el.scrollTop = 0;
            setScrollTop(0);
        }
    }, [effectiveTotal, containerHeight]);

    return {
        containerRef,
        handleScroll,
        startIndex,
        endIndex,
        topPaddingHeight,
        bottomPaddingHeight,
    };
}
