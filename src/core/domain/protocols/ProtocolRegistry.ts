import type { LayerRole } from "@core/framework/types";
import type { Protocol } from "./Protocol";

export class ProtocolRegistry {
  private readonly byRole = new Map<LayerRole, Protocol[]>();
  private readonly byId = new Map<string, Protocol>();

  register(protocol: Protocol): void {
    if (this.byId.has(protocol.id)) {
      throw new Error(
        `Protocol "${protocol.id}" is already registered.`,
      );
    }
    this.byId.set(protocol.id, protocol);

    for (const role of protocol.roles) {
      const protocols = this.byRole.get(role);
      if (protocols) {
        protocols.push(protocol);
      } else {
        this.byRole.set(role, [protocol]);
      }
    }
  }

  getByRole(role: LayerRole): Protocol | undefined {
    return this.byRole.get(role)?.[0];
  }

  getProtocolsByRole(role: LayerRole): readonly Protocol[] {
    return this.byRole.get(role) ?? [];
  }

  getById(id: string): Protocol | undefined {
    return this.byId.get(id);
  }

  getAll(): Protocol[] {
    return [...new Set(this.byId.values())];
  }
}
