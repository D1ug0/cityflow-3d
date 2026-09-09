import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  PlaneGeometry,
  Points,
} from 'three';
import type { Route } from '@/entities/route';
import { ResourceManager } from '@/shared/lib/three/ResourceManager';
import { flowMaterial, glowMaterial, rainMaterial } from '@/shared/lib/three/shaders';
export class TrafficEffects {
  readonly resources = new ResourceManager();
  readonly root = new Object3D();
  readonly flow: Mesh;
  readonly selection: Mesh;
  readonly rain: Points;
  constructor(routes: Route[]) {
    const vertices: number[] = [],
      distances: number[] = [];
    for (const route of routes)
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1],
          b = route.points[i];
        const length = route.distances[i] - route.distances[i - 1];
        const nx = (-(b[1] - a[1]) / length) * 2.5,
          ny = ((b[0] - a[0]) / length) * 2.5;
        const corners = [
          [a[0] + nx, a[1] + ny],
          [a[0] - nx, a[1] - ny],
          [b[0] + nx, b[1] + ny],
          [b[0] - nx, b[1] - ny],
        ];
        for (const index of [0, 1, 2, 2, 1, 3]) {
          vertices.push(...corners[index], 0.08);
          distances.push(route.distances[index < 2 ? i - 1 : i]);
        }
      }
    const geometry = this.resources.track(new BufferGeometry());
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('distanceAlong', new Float32BufferAttribute(distances, 1));
    this.flow = new Mesh(geometry, this.resources.track(flowMaterial()));
    this.selection = new Mesh(
      this.resources.track(new PlaneGeometry(8, 5)),
      this.resources.track(glowMaterial()),
    );
    this.selection.visible = false;
    const rainGeometry = this.resources.track(new BufferGeometry());
    const drops = new Float32Array(10000 * 3),
      phases = new Float32Array(10000);
    for (let i = 0; i < 10000; i++) {
      drops[i * 3] = (((i * 0.61803398875) % 1) - 0.5) * 2400;
      drops[i * 3 + 1] = (((i * 0.754877666) % 1) - 0.5) * 2400;
      drops[i * 3 + 2] = ((i * 0.569840291) % 1) * 350;
      phases[i] = (i * 0.41421356) % 1;
    }
    rainGeometry.setAttribute('position', new Float32BufferAttribute(drops, 3));
    rainGeometry.setAttribute('phase', new Float32BufferAttribute(phases, 1));
    this.rain = new Points(rainGeometry, this.resources.track(rainMaterial()));
    this.rain.frustumCulled = false;
    this.root.add(this.flow, this.selection, this.rain);
  }
  dispose() {
    this.resources.dispose();
    this.root.clear();
  }
}
