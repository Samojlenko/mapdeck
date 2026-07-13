import type { Download } from "@core/framework/types";
import type { IRoleResolver, ResolveContext } from "../IRoleResolver";
import type { STACAsset } from "../../types";
import { isReportAsset } from "../../assets/AssetClassifier";

export class DownloadResolver implements IRoleResolver {
    readonly priority = 0;

    canResolve(asset: STACAsset): boolean {
        return isReportAsset(asset);
    }

    resolve(asset: STACAsset, ctx: ResolveContext): Download {
        return {
            id: ctx.assetKey,
            category: "report",
            label: asset.title ?? ctx.assetKey,
            sourceUrl: asset.href,
            ...(asset.type ? { mimeType: asset.type } : {}),
        };
    }
}
