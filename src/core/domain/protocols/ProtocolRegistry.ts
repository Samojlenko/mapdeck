import type { LayerRole } from "@core/framework/types";
import type { Protocol } from "./Protocol";

export class ProtocolRegistry {
  private readonly byRole = new Map<LayerRole, Protocol>();

  register(protocol: Protocol): void {
    for (const role of protocol.roles) {
      if (this.byRole.has(role)) {
        throw new Error(
          `Role "${role}" is already registered by protocol "${this.byRole.get(role)!.id}". ` +
          `Cannot register "${protocol.id}". One role = one protocol.`,
        );
      }

      this.byRole.set(role, protocol);
    }
  }

  getByRole(role: LayerRole): Protocol | undefined {
    return this.byRole.get(role);
  }

  getAll(): Protocol[] {
    return [...new Set(this.byRole.values())];
  }
}
