import { reaction, type IReactionDisposer } from "mobx";
import { createCancellable, type CancellableTask } from "@core/shared/async";

export interface CancellableReactionResult {
    reaction: IReactionDisposer;
    getCurrentTask: () => CancellableTask | null;
}

/**
 * Creates a MobX reaction that supports async cancellation.
 * Each time the reaction fires, the previous async task is cancelled
 * before the new one starts.
 *
 * @param expression - Function that returns the value to track
 * @param effect - Async function to run when the value changes (receives AbortSignal)
 * @param options - MobX reaction options
 */
export function createCancellableReaction<T>(
    expression: () => T,
    effect: (value: T, signal: AbortSignal) => Promise<void>,
    options?: Record<string, unknown>,
): CancellableReactionResult {
    let currentTask: CancellableTask | null = null;

    const reactionDisposer = reaction(
        expression,
        (value) => {
            if (currentTask) {
                currentTask.cancel();
            }
            currentTask = createCancellable();
            currentTask.run((signal) => effect(value, signal));
        },
        {
            ...options,
            onError: () => {
                // Errors are already logged by createCancellable().run()
            },
        },
    );

    return {
        reaction: reactionDisposer,
        getCurrentTask: () => currentTask,
    };
}
