export interface Metrics {
  fps: number;
  minFps: number;
  frameMs: number;
  renderMs: number;
  calls: number;
  triangles: number;
  textures: number;
  geometries: number;
  vehicles: number;
  visible: number;
  dpr: number;
}
export const emptyMetrics = (): Metrics => ({
  fps: 0,
  minFps: 0,
  frameMs: 0,
  renderMs: 0,
  calls: 0,
  triangles: 0,
  textures: 0,
  geometries: 0,
  vehicles: 0,
  visible: 0,
  dpr: 1,
});
export class FrameBudget {
  constructor(public targetFps = 60) {}
  get milliseconds() {
    return 1000 / this.targetFps;
  }
  exceeded(frameMs: number) {
    return frameMs > this.milliseconds;
  }
}
export class PerformanceMonitor {
  private samples: number[] = [];
  private last = 0;
  record(now: number): Pick<Metrics, 'fps' | 'minFps' | 'frameMs'> {
    const delta = this.last ? now - this.last : 0;
    this.last = now;
    if (delta > 0 && delta < 1000) {
      this.samples.push(delta);
      if (this.samples.length > 120) this.samples.shift();
    }
    const mean = this.samples.reduce((sum, value) => sum + value, 0) / (this.samples.length || 1);
    return {
      fps: mean ? 1000 / mean : 0,
      minFps: this.samples.length ? 1000 / Math.max(...this.samples) : 0,
      frameMs: mean,
    };
  }
  reset() {
    this.last = 0;
    this.samples = [];
  }
}
