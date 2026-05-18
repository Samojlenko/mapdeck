# How to Add a Layer Tool

## Interface

`LayerTool` — lightweight object with `id`, `role` (which `LayerRole` it applies to), and a `component` factory.

See: [`src/core/framework/types/domain/layer/tool.ts`](../../../src/core/framework/types/domain/layer/tool.ts)

LayerTool is **always an object**, never a class. See [extending.md](./extending.md) — Objects vs Classes.

---

## Step-by-Step

### 1. Create directory

```
src/layer-tools/<tool-name>/
├── index.ts              # LayerTool definition
├── locale.ts             # Translations
├── components/
│   ├── Tool.tsx          # LayerTool object definition
│   ├── Panel.tsx         # React component
│   └── Panel.module.css  # Styles (optional)
```

### 2. Define the React component

Receives `nodeId` as the only prop. Use it to access the layer node via `rootStore.treeStore.getNode(nodeId)`.

See: [`src/layer-tools/raster-opacity/components/Panel.tsx`](../../../src/layer-tools/raster-opacity/components/Panel.tsx)

### 3. Define the tool object

```ts
import type { LayerTool } from "@core/types";
import { LayerRole } from "@core/types";
import { RasterOpacitySlider } from "./RasterOpacitySlider";

export const rasterOpacityTool: LayerTool = {
    id: "raster-opacity-slider",
    role: LayerRole.RASTER,
    component: (nodeId: string) => <RasterOpacitySlider nodeId={nodeId} />,
};
```

### 4. Register

Add to `BUILT_IN_TOOLS` array in [`src/layer-tools/registerTools.ts`](../../../src/layer-tools/registerTools.ts). Registration uses `rootStore.layerToolStore.registerTool(tool)`.

---

## Multi-Role Tools

Tool supports `role: LayerRole | LayerRole[] | "all"` via the `LayerToolRole` type.

---

## Styles

Use CSS Modules (`.module.css`) and theme variables. See [widgets.md](./widgets.md) — Styles & Theming.

---

## Related

- [extending.md](./extending.md) — General extension guide
- [map-tools.md](./map-tools.md) — Map interaction tools (different from layer tools)
