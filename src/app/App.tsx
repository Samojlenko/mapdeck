import { observer } from "mobx-react-lite";
import { StoreProvider, useRootStore, RootStore } from "@core/framework/store";
import { initializeApp } from "./initialize";
import { useAsyncEffect } from "@core/framework/hooks";
import { LoadingScreen, ErrorScreen } from "@core/ui/components";
import MapWorkspace from "./workspace";

// Singleton: intentional, persists across HMR cycles
const rootStore = new RootStore();

const AppContent = observer(() => {
    const rootStore = useRootStore();

    useAsyncEffect(async () => {
        await initializeApp(rootStore);
    }, [rootStore]);

    if (rootStore.initError) {
        const dict = rootStore.localeStore.t("core");
        return (
            <ErrorScreen
                message={rootStore.initError}
                onRetry={() => initializeApp(rootStore)}
                dict={dict}
            />
        );
    }

    if (!rootStore.isInitialized) {
        return <LoadingScreen />;
    }

    return <MapWorkspace />;
});

const App = () => {
    return (
        <StoreProvider store={rootStore}>
            <AppContent />
        </StoreProvider>
    );
};

export default App;
