import type { RootStore } from "@core/framework/store";
import { LayerRoles } from "@core/framework/types";
import { WfsAttributeAdapter } from "./impl/WfsAttributeAdapter";
import { OgcFeaturesAttributeAdapter } from "./impl/OgcFeaturesAttributeAdapter";

export async function registerAttributeAdapters(
    rootStore: RootStore,
): Promise<void> {
    rootStore.attributeAdapterFactory.register(
        LayerRoles.of("wfs"),
        new WfsAttributeAdapter(),
    );
    rootStore.attributeAdapterFactory.register(
        LayerRoles.of("ogc-features"),
        new OgcFeaturesAttributeAdapter(),
    );
}
