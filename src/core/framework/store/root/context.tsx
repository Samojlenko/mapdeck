import { createContext, useContext, type ReactNode } from "react";
import { RootStore } from "./rootStore";

const StoreContext = createContext<RootStore | null>(null);

export interface StoreProviderProps {
    children: ReactNode;
    store: RootStore;
}

export function StoreProvider({
    children,
    store,
}: Readonly<StoreProviderProps>) {
    return (
        <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
}

export function useRootStore(): RootStore {
    const rootStore = useContext(StoreContext);

    if (!rootStore) {
        throw new Error(
            "useRootStore must be used within a StoreProvider. " +
                "Wrap your application with <StoreProvider store={rootStore}>.",
        );
    }

    return rootStore;
}
