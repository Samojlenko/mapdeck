import { useEffect, type RefObject } from "react";

interface UseClickOutsideOptions {
    /** When `true`, defers listener attachment by one tick (`setTimeout 0`)
     *  to avoid capturing the same event that opened the element. */
    defer?: boolean;
}

/**
 * Calls `handler` when a `mousedown` event fires outside the given `ref` element.
 *
 * @param ref     - React ref to the watched element
 * @param handler - Callback invoked on outside click
 * @param enabled - When `false`, the listener is not attached (defaults to `true`)
 * @param options - Additional options
 */
export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: () => void,
    enabled = true,
    { defer = false }: UseClickOutsideOptions = {},
): void {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        if (defer) {
            const timer = setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 0);
            return () => {
                clearTimeout(timer);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, handler, enabled, defer]);
}
