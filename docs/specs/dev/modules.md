# How to Add a Module

## Interface

`Module<TConfig>` — registration contract. Optional: `setRootStore()`.

See: [`src/core/framework/types/framework/module.ts`](../../../src/core/framework/types/framework/module.ts)

A module can contain **anything**: data sources, widgets, tools, map tools. There are no restrictions beyond the `Module` interface.

For data source modules, register a `SourceAdapter` with the `sourceAdapterFactory` singleton:

```ts
import { sourceAdapterFactory } from "@core/domain/adapters";
import { MyTreeAdapter } from "./adapter/MyTreeAdapter";

class MyModule implements Module {
    readonly id = "my-module";
    readonly name = "My Data Module";

    async register(): Promise<void> {
        const adapter = new MyTreeAdapter();
        await sourceAdapterFactory.register("my-module", adapter);
    }
}
```

See: [`src/core/domain/adapters/source/SourceAdapterFactory.ts`](../../../src/core/domain/adapters/source/SourceAdapterFactory.ts)

---

## Step-by-Step

### 1. Create directory

```
src/modules/<module-name>/
├── index.ts                  # Module export (singleton)
├── module/
│   └── <Module>Module.ts     # Class implementing Module (+ optional interfaces)
├── adapter/                  # SourceAdapter (if data source)
│   └── <Module>TreeAdapter.ts
├── core/                     # Internal logic (client, cache, mapper)
├── mapping/                  # Maps external data → NodeRole[] + TreeNode
├── types.ts                  # External data types
└── config.json               # Default config
```

### 2. Define the module class

Module is a **class if it has state**, an **object if stateless** (see [extending.md](./extending.md) — Objects vs Classes).

```ts
import { type Module } from "@core/types";
import { sourceAdapterFactory } from "@core/domain/adapters";
import type { RootStore } from "@store";
import type { MyModuleConfig } from "./core/MyModuleConfig";
import { MyTreeAdapter } from "./adapter/MyTreeAdapter";

export class MyModule implements Module<MyModuleConfig> {
    readonly id = "my-module";
    readonly name = "My Data Module";

    private config: MyModuleConfig | null = null;
    private rootStore: RootStore | null = null;

    async register(config?: MyModuleConfig): Promise<void> {
        this.config = config ?? { /* defaults */ };
        const adapter = new MyTreeAdapter(config);
        await sourceAdapterFactory.register("my-module-source", adapter);
    }

    setRootStore(rootStore: RootStore): void {
        this.rootStore = rootStore;
        // Optionally register widgets or tools
        this.rootStore.catalogStore.registerWidget(MyWidget);
    }
}

export const myModule = new MyModule();
```

### 3. Implement SourceAdapter (if data source)

`SourceAdapter` converts external data into `TreeNode[]` with `NodeRole[]`. Core knows nothing about the external format.

See: [`src/core/framework/types/domain/source/adapter.ts`](../../../src/core/framework/types/domain/source/adapter.ts)

### 4. Register

Add to the modules array in [`src/modules/registerModules.ts`](../../../src/modules/registerModules.ts)

---

## Initialization Order

Modules are registered **last**, right before `fetchLayerTree()`:

```
1. registerLayerAdapters()     ← Core layer adapters (Raster, Vector, etc.)
2. registerBuiltInWidgets()    ← Built-in widgets
3. registerTools()             ← Built-in layer tools
4. registerMapTools()          ← Built-in map tools
5. registerModules()           ← Modules (may register widgets/tools/sources)
6. fetchLayerTree()            ← Load tree (needs all sources registered)
7. markInitialized()           ← UI renders
```

This ensures all built-in components are ready before modules add their own.

---

## NodeRole Mapping

Every `SourceAdapter` returns `TreeNode[]` where each node has `roles: NodeRoles`. The module is responsible for mapping its data format into roles:

| Category | Purpose |
|----------|---------|
| `display` | Layer config for rendering on map |
| `attribute` | Endpoint for attribute data |
| `report` | Download link for reports |

Core does **not** know about the external format (STAC, GeoJSON, etc.). The module's mapper handles all translation.

See: [`src/modules/stac/mapping/`](../../../src/modules/stac/mapping/)

---

## Related

- [extending.md](./extending.md) — General extension guide
- [state-management.md](../domain/state-management.md) — RootStore access pattern
