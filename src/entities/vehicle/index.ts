import { sampleRoute, type Route, type RouteSample } from '@/entities/route';
export interface VehicleDetails {
  id: string;
  speed: number;
  route: string;
  progress: number;
  status: 'moving' | 'paused';
  type: string;
  position: [number, number];
  rotation: number;
}
export class VehicleSimulation {
  readonly progress: Float64Array;
  readonly speeds: Float32Array;
  readonly routeIndices: Uint16Array;
  readonly sample: RouteSample = { x: 0, y: 0, heading: 0 };
  constructor(
    public readonly routes: Route[],
    public readonly count: number,
  ) {
    if (!routes.length || !Number.isInteger(count) || count < 1 || count > 10000)
      throw new Error('Некорректная конфигурация симуляции.');
    this.progress = new Float64Array(count);
    this.speeds = new Float32Array(count);
    this.routeIndices = new Uint16Array(count);
    for (let i = 0; i < count; i++) {
      this.progress[i] = (i * 0.61803398875) % 1;
      this.speeds[i] = 22 + ((i * 17) % 39);
      this.routeIndices[i] = i % routes.length;
    }
  }
  update(delta: number) {
    const dt = Math.max(0, Math.min(delta, 0.1));
    for (let i = 0; i < this.count; i++)
      this.progress[i] =
        (this.progress[i] +
          ((this.speeds[i] / 3.6) * dt) / this.routes[this.routeIndices[i]].length) %
        1;
  }
  position(index: number) {
    return sampleRoute(this.routes[this.routeIndices[index]], this.progress[index], this.sample);
  }
  details(index: number, paused: boolean): VehicleDetails {
    const p = this.position(index);
    return {
      id: `car-${index + 1}`,
      speed: this.speeds[index],
      route: this.routes[this.routeIndices[index]].name,
      progress: this.progress[index],
      status: paused ? 'paused' : 'moving',
      type: 'Легковой',
      position: [p.x, p.y],
      rotation: p.heading,
    };
  }
}
