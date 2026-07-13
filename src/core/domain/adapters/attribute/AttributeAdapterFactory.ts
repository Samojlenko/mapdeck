/**
 * Factory for managing attribute data adapters by adapter type.
 */
import type {
    AttributeDataAdapter,
    DataTable,
    LayerRole,
} from "@core/framework/types";

export class AttributeAdapterFactory {
    private readonly adapters = new Map<LayerRole, AttributeDataAdapter>();

    register(role: LayerRole, adapter: AttributeDataAdapter): void {
        this.adapters.set(role, adapter);
    }

    get(dataTable: DataTable): AttributeDataAdapter {
        const adapter = this.adapters.get(dataTable.role);
        if (!adapter) {
            throw new Error(
                `No attribute adapter registered for role: ${dataTable.role}`,
            );
        }
        return adapter;
    }

    has(role: LayerRole): boolean {
        return this.adapters.has(role);
    }
}
