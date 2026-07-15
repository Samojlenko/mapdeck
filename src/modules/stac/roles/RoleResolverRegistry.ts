import type { IRoleResolver, ResolveContext, ResolveResult } from "./IRoleResolver";
import type { STACAsset } from "../types";

export class RoleResolverRegistry {
  private resolvers: IRoleResolver[] = [];

  register(resolver: IRoleResolver): void {
    this.resolvers.push(resolver);
    this.resolvers.sort((a, b) => a.priority - b.priority);
  }

  resolve(asset: STACAsset, ctx: ResolveContext): ResolveResult | null {
    for (const resolver of this.resolvers) {
      if (resolver.canResolve(asset, ctx)) {
        return resolver.resolve(asset, ctx);
      }
    }
    return null;
  }
}
