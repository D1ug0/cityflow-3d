import { describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Texture } from 'three';
import { ResourceManager } from '@/shared/lib/three/ResourceManager';
import { VehicleRenderer } from '@/entities/vehicle/VehicleRenderer';
import { VehicleSimulation } from '@/entities/vehicle';
import type { Route } from '@/entities/route';
describe('resource lifecycle and culling', () => {
  it('disposes shared resources exactly once and cleanup is idempotent', () => {
    const manager = new ResourceManager();
    const geometry = new BoxGeometry();
    const texture = new Texture();
    const material = new MeshBasicMaterial({ map: texture });
    const spies = [
      vi.spyOn(geometry, 'dispose'),
      vi.spyOn(texture, 'dispose'),
      vi.spyOn(material, 'dispose'),
    ];
    manager.trackObject(new Mesh(geometry, material));
    manager.trackObject(new Mesh(geometry, material));
    manager.dispose();
    manager.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  });
  it('compacts visible vehicles while preserving instance selection IDs', () => {
    const route: Route = {
      id: 'r',
      name: 'r',
      points: [
        [0, 0],
        [100, 0],
      ],
      distances: new Float64Array([0, 100]),
      length: 100,
    };
    const sim = new VehicleSimulation([route], 3);
    sim.progress.set([0.8, 0, 0.9]);
    const renderer = new VehicleRenderer(sim);
    const count = renderer.update(new Matrix4(), 0);
    expect(count).toBe(1);
    expect(renderer.visibleIds[0]).toBe(1);
    expect(renderer.mesh.count).toBe(1);
    renderer.dispose();
  });
});
