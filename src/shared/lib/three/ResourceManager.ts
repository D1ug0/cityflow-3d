import { Texture, Mesh, type Object3D } from 'three';
export class ResourceManager {
  private resources = new Set<{ dispose(): void }>();
  track<T extends { dispose(): void }>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }
  trackObject(object: Object3D) {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        this.track(child.geometry);
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          this.track(material);
          for (const value of Object.values(material))
            if (value instanceof Texture) this.track(value);
        }
      }
    });
  }
  dispose() {
    for (const resource of this.resources) resource.dispose();
    this.resources.clear();
  }
}
