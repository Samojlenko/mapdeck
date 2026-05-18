/**
 * Creates a debounced version of the provided function.
 * The debounced function delays invoking `fn` until `delay` ms have elapsed
 * since the last invocation. Returns a callable with an optional `cancel()` method
 * to clear any pending invocation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
): {
    (this: ThisParameterType<T>, ...args: Parameters<T>): void;
    cancel?: () => void;
} {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (
        this: ThisParameterType<T>,
        ...args: Parameters<T>
    ): void {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, args);
        }, delay);
    };

    debounced.cancel = (): void => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    return debounced;
}
