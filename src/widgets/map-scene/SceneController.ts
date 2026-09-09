import {
  AmbientLight,
  DirectionalLight,
  Raycaster,
  ShaderMaterial,
  Vector3,
  type Scene,
} from 'three';
import type { Map as LibreMap, MapMouseEvent } from 'maplibre-gl';
import {
  GRAPHICS,
  pixelRatio,
  selectLod,
  type Quality,
  type TimeOfDay,
} from '@/shared/config/graphics';
import { applyMapTheme } from '@/shared/lib/maplibre/apply-map-theme';
import { PerformanceMonitor, type Metrics } from '@/shared/lib/performance/PerformanceMonitor';
import { QualityManager } from '@/shared/lib/performance/QualityManager';
import type { SceneAdapter, LayerFrame } from '@/shared/lib/three/ThreeMapLayer';
import type { Route } from '@/entities/route';
import { VehicleSimulation, type VehicleDetails } from '@/entities/vehicle';
import { VehicleRenderer } from '@/entities/vehicle/VehicleRenderer';
import { TrafficEffects } from '@/entities/traffic/TrafficEffects';
export interface SceneOptions {
  quality: Quality;
  count: number;
  traffic: boolean;
  buildings: boolean;
  flow: boolean;
  rain: boolean;
  paused: boolean;
  adaptive: boolean;
  time: TimeOfDay;
}
interface Callbacks {
  metrics(value: Metrics): void;
  selection(value: VehicleDetails | null): void;
  quality(value: Quality): void;
  warning(message: string): void;
}
export class SceneController implements SceneAdapter {
  private scene?: Scene;
  private map?: LibreMap;
  private vehicles?: VehicleRenderer;
  private effects?: TrafficEffects;
  private ambient = new AmbientLight(0xffffff, 1.7);
  private sun = new DirectionalLight(0xfff2d7, 2.5);
  private monitor = new PerformanceMonitor();
  private qualityManager = new QualityManager();
  private selected: number | null = null;
  private frame?: LayerFrame;
  private lastPublish = 0;
  private elapsed = 0;
  private visible = 0;
  private renderSum = 0;
  private renderSamples = 0;
  private disposed = false;
  constructor(
    private routes: Route[],
    private options: SceneOptions,
    private callbacks: Callbacks,
  ) {}
  attach(scene: Scene, map: LibreMap) {
    this.scene = scene;
    this.map = map;
    this.sun.position.set(-500, -600, 1000);
    scene.add(this.ambient, this.sun);
    this.effects = new TrafficEffects(this.routes);
    scene.add(this.effects.root);
    this.createVehicles();
    this.configure(this.options);
    map.on('click', this.onClick);
  }
  private createVehicles() {
    if (!this.scene) return;
    if (this.vehicles) {
      this.scene.remove(this.vehicles.root);
      this.vehicles.dispose();
    }
    this.selected = null;
    this.callbacks.selection(null);
    this.vehicles = new VehicleRenderer(new VehicleSimulation(this.routes, this.options.count));
    this.scene.add(this.vehicles.root);
    void this.vehicles.loadModel().catch(() => {
      if (!this.disposed)
        this.callbacks.warning(
          'Не удалось загрузить car.gltf. Используется упрощённая модель автомобиля.',
        );
    });
  }
  configure(options: SceneOptions) {
    const previous = this.options;
    this.options = { ...options };
    if (options.count !== previous.count) this.createVehicles();
    if (options.quality !== previous.quality || options.adaptive !== previous.adaptive)
      this.qualityManager.reset(performance.now());
    if (!this.map || !this.effects || !this.vehicles) return;
    this.map.setPixelRatio(pixelRatio(options.quality, window.devicePixelRatio));
    if (this.map.getLayer('buildings'))
      this.map.setLayoutProperty('buildings', 'visibility', options.buildings ? 'visible' : 'none');
    const night = options.time === 'night',
      sunset = options.time === 'sunset';
    applyMapTheme(this.map, options.time);
    this.ambient.intensity = night ? 0.7 : 1.7;
    this.sun.intensity = night ? 0.7 : 2.5;
    this.sun.color.set(sunset ? '#ffad76' : night ? '#8bb6f0' : '#fff2d7');
    this.vehicles.root.visible = options.traffic;
    this.effects.flow.visible = options.flow;
    this.effects.rain.visible = options.rain;
    this.effects.rain.geometry.setDrawRange(0, GRAPHICS[options.quality].rain);
    (this.effects.rain.material as ShaderMaterial).uniforms.uDpr.value = this.map.getPixelRatio();
    (this.effects.flow.material as ShaderMaterial).uniforms.uDensity.value = Math.min(
      1,
      options.count / 10000,
    );
    (this.effects.selection.material as ShaderMaterial).uniforms.uIntensity.value = night ? 1.5 : 1;
    if (!options.traffic) this.clearSelection();
    this.map.triggerRepaint();
  }
  clearSelection() {
    this.selected = null;
    this.callbacks.selection(null);
    if (this.effects) this.effects.selection.visible = false;
  }
  resetTiming() {
    this.monitor.reset();
    this.qualityManager.reset(performance.now());
    this.lastPublish = 0;
    this.renderSum = 0;
    this.renderSamples = 0;
  }
  update(frame: LayerFrame) {
    this.frame = frame;
    if (!this.vehicles || !this.effects) return;
    if (!this.options.paused) {
      this.vehicles.simulation.update(frame.delta);
      this.elapsed += frame.delta;
    }
    this.visible = this.options.traffic
      ? this.vehicles.update(
          frame.camera.projectionMatrix,
          selectLod(frame.map.getZoom(), this.options.quality),
        )
      : 0;
    for (const mesh of [this.effects.flow, this.effects.rain, this.effects.selection])
      (mesh.material as ShaderMaterial).uniforms.uTime.value = this.elapsed;
    this.effects.selection.visible = this.selected !== null && this.options.traffic;
    if (this.selected !== null) {
      const p = this.vehicles.simulation.position(this.selected);
      this.effects.selection.position.set(p.x, p.y, 0.15);
      this.effects.selection.rotation.z = p.heading;
    }
  }
  afterRender(frame: LayerFrame, renderMs: number) {
    const rates = this.monitor.record(frame.now);
    this.renderSum += renderMs;
    this.renderSamples++;
    if (frame.now - this.lastPublish < 500) return;
    this.lastPublish = frame.now;
    const info = frame.renderer.info;
    this.callbacks.metrics({
      ...rates,
      renderMs: this.renderSum / this.renderSamples,
      calls: info.render.calls,
      triangles: info.render.triangles,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      vehicles: this.options.count,
      visible: this.visible,
      dpr: frame.map.getPixelRatio(),
    });
    this.renderSum = 0;
    this.renderSamples = 0;
    if (this.selected !== null && this.vehicles)
      this.callbacks.selection(
        this.vehicles.simulation.details(this.selected, this.options.paused),
      );
    if (this.options.adaptive) {
      const next = this.qualityManager.update(rates.fps, frame.now, this.options.quality);
      if (next !== this.options.quality) this.callbacks.quality(next);
    }
  }
  private onClick = (event: MapMouseEvent) => {
    if (!this.vehicles || !this.frame || !this.options.traffic) return;
    const canvas = event.target.getCanvas();
    const x = (event.point.x / canvas.clientWidth) * 2 - 1,
      y = 1 - (event.point.y / canvas.clientHeight) * 2;
    // The camera projection includes view+model; invert it directly to obtain a local-space ray.
    const inverse = this.frame.camera.projectionMatrixInverse;
    const near = new Vector3(x, y, -1).applyMatrix4(inverse),
      far = new Vector3(x, y, 1).applyMatrix4(inverse);
    const ray = new Raycaster(near, far.sub(near).normalize());
    this.vehicles.mesh.updateMatrixWorld(true);
    const hit = ray.intersectObject(this.vehicles.mesh, false)[0];
    if (hit?.instanceId !== undefined) {
      this.selected = this.vehicles.visibleIds[hit.instanceId];
      this.callbacks.selection(
        this.vehicles.simulation.details(this.selected, this.options.paused),
      );
    } else this.clearSelection();
  };
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.map?.off('click', this.onClick);
    this.vehicles?.dispose();
    this.effects?.dispose();
    this.scene?.remove(this.ambient, this.sun);
    this.ambient.dispose();
    this.sun.dispose();
    this.vehicles = undefined;
    this.effects = undefined;
    this.map = undefined;
    this.scene = undefined;
    this.frame = undefined;
  }
}
