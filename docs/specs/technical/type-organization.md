# Type Organization

## Structure

Types are organized by abstraction level in `src/core/framework/types/`:

```
src/core/framework/types/
├── index.ts              # Barrel export — all imports via @core/types
├── geo.ts                # Bbox, coordinate types
├── framework/            # Platform abstractions (no domain knowledge)
│   ├── locale.ts         # SupportedLanguage, TranslationDict
│   ├── module.ts         # Module interface
│   ├── overlay.ts        # IOverlayManager interface
│   ├── settings.ts       # SettingMetadata, RegisteredSetting, SettingsGroup
│   ├── tools.ts          # MapTool, MapActionTool, MapToolComponentProps, MapToolPlacement
│   ├── widget.ts         # Widget, WidgetComponent, WidgetContext
│   ├── widgetConfig.ts   # WidgetSizeConfig, WidgetBaseConfig, WidgetConfig, WidgetSize
│   └── index.ts
├── domain/               # Geospatial domain types
│   ├── attribute/        # AttributeData
│   ├── layer/            # LayerRole, LayerConfig, LayerAdapter, LayerTool
│   ├── node/             # NodeRole, NodeRoles, TreeNode, GroupNode, LayerNode
│   ├── source/           # DataSourceConfig, DataSourceRegistry, SourceAdapter
│   └── index.ts
├── data/                 # Pure data structures (no UI)
│   ├── pointCloud.ts     # PointCloudData, LoaderOptions
│   ├── streaming.ts      # CopcLoadingMode, CachedNode, CopcMetadata, etc.
│   └── measurement.ts    # MeasurementPoint3D, VolumeMeasurements
├── config/               # Application configuration types
│   └── config.ts         # BaseMapConfig, STACSettings, LayerTreeSettings
└── ogc/                  # OGC protocol types (WMS, WFS)
    ├── index.ts
    ├── wms.ts
    └── wfs.ts
```

---

## Import Rule

**All imports go through `@core/types`.** No direct subpath imports.

```ts
// Good
import { Widget, LayerRole, PointCloudData } from "@core/types";

// Bad
import { Widget } from "@core/types/framework/widget";
import { LayerRole } from "@core/types/domain/layer";
```

The barrel `index.ts` re-exports everything from the correct subdirectories.

---

## Dependency Flow

```
framework  ←  domain  ←  data
    ↓           ↓
  settings   map-tool
```

- **framework** — no dependencies on other type directories
- **domain** — may depend on `framework` (e.g., `MapTool` uses `SettingMetadata`)
- **data** — no dependencies on other type directories
- **config** — standalone application settings

---

## Adding New Types

1. Identify the abstraction level:
   - Platform abstraction → `framework/`
   - Geospatial domain → `domain/` (subdirectory by concept)
   - Pure data structure → `data/`
   - App configuration → `config/`
2. Add to the appropriate subdirectory
3. Export from subdirectory `index.ts`
4. Re-export from root `index.ts`
