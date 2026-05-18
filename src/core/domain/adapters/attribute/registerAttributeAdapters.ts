import { attributeAdapterFactory } from "./AttributeAdapterFactory";
import { WfsAttributeAdapter } from "./impl/WfsAttributeAdapter";

export async function registerAttributeAdapters(): Promise<void> {
    attributeAdapterFactory.register("wfs", new WfsAttributeAdapter());
}
