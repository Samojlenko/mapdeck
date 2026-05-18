# How to Add a Map Tool

## Interface

`MapTool` — class implementing the MapTool interface. Two subtypes:

| Subtype | Purpose | Key method |
|---------|---------|------------|
| **MapTool** | Stays active, draws on map, shows component | `activate(map)` / `deactivate()` |
| **MapActionTool** | One-click action (e.g. reset orientation) | `execute(rootStore)` |

See: [`src/core/framework/types/framework/tools.ts`](../../../src/core/framework/types/framework/tools.ts)

---

## Step-by-Step

### 1. Create directory

```
src/map-tools/<tool-name>/
├── index.ts
├── locale.ts                # Translations (optional)
├── types.ts                 # Types (optional)
├── components/
│   ├── Tool.ts              # Class implementing MapTool
│   ├── Panel.tsx            # React component (rendered when active)
│   └── Panel.module.css
└── utils/                   # Pure functions (optional)
    └── ...
```

### 2. Define the class

MapTool is **always a class** — it has state (`isActive`), lifecycle (`activate`/`deactivate`), and may own a MobX store.

**Interactive tool:**

```ts
import { makeObservable, observable } from "mobx";
import maplibregl from "maplibre-gl";
import type { MapTool, MapToolPlacement } from "@core/types";
import type { RootStore } from "@core/framework/store";
import { MyToolComponent } from "./MyToolComponent";

export class MyTool implements MapTool {
    readonly id = "my-tool";
    readonly name = "My Tool";
    readonly icon = "ruler";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 10;
    readonly component = MyToolComponent;

    isActive = false;

    constructor() {
        makeObservable(this, { isActive: observable });
    }

    activate(_map: maplibregl.Map): void {
        this.isActive = true;
    }

    deactivate(): void {
        this.isActive = false;
    }
}
```

**Action tool:**

```ts
export class ResetOrientationTool implements MapActionTool {
    readonly id = "reset-orientation";
    readonly name = "Reset Orientation";
    readonly icon = "compass";

    execute(rootStore: RootStore): void {
        rootStore.mapStore.getMap()?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    }
}
```

### 3. Define the React component

Receives `MapToolComponentProps`: `rootStore`, `map`, `deactivate`.

See: [`src/map-tools/ruler-3d/components/Panel.tsx`](../../../src/map-tools/ruler-3d/components/Panel.tsx)

### 4. Register

Add `new MyTool()` to `BUILT_IN_TOOLS` in [`src/map-tools/registerMapTools.ts`](../../../src/map-tools/registerMapTools.ts)

---

## Tool State

MapTool instances are classes — they hold their own state (`isActive`, event listeners, etc.) directly on the instance. No separate tool-local store registry exists; the tool instance itself persists across activate/deactivate cycles.

---

## Settings Auto-Registration

Declare settings directly on the tool — they are auto-registered by `MapToolStore.registerTool()`:

```ts
readonly settings: SettingMetadata[] = [
    { id: "my-tool.unit", label: "Unit", type: "select", defaultValue: "meters", options: [...] },
];
```

See: [`src/map-tools/basemap/components/Tool.ts`](../../../src/map-tools/basemap/components/Tool.ts)

---

## Styles

Use CSS Modules (`.module.css`) and theme variables. See [widgets.md](./widgets.md) — Styles & Theming.

---

## Related

- [extending.md](./extending.md) — General extension guide
- [tools.md](./tools.md) — Layer tools (different from map tools)
