import { Camera, Matrix4, Scene, Vector3, WebGLRenderer } from 'three';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as LibreMap } from 'maplibre-gl';
import { meterScale, origin } from '@/shared/lib/maplibre/coordinates';
export interface LayerFrame {
  now: number;
  delta: number;
  camera: Camera;
  renderer: WebGLRenderer;
  map: LibreMap;
}
export interface SceneAdapter {
  attach(scene: Scene, map: LibreMap): void;
  update(frame: LayerFrame): void;
  afterRender(frame: LayerFrame, renderMs: number): void;
  dispose(): void;
}
/** Infrastructure only: no Vue or domain imports. MapLibre owns the canvas and loop. */
export class ThreeMapLayer implements CustomLayerInterface {
  readonly id = 'cityflow-3d';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  readonly scene = new Scene();
  readonly camera = new Camera();
  private renderer?: WebGLRenderer;
  private map?: LibreMap;
  private last = 0;
  private removed = false;
  private transform = new Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new Vector3(meterScale, -meterScale, meterScale));
  constructor(private adapter: SceneAdapter) {}
  onAdd(map: LibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl as WebGL2RenderingContext,
    });
    this.renderer.autoClear = false;
    this.adapter.attach(this.scene, map);
  }
  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput) {
    if (!this.renderer || !this.map || this.removed) return;
    const now = performance.now();
    const delta = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    this.camera.projectionMatrix
      .fromArray(args.defaultProjectionData.mainMatrix)
      .multiply(this.transform);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    const frame = { now, delta, camera: this.camera, renderer: this.renderer, map: this.map };
    this.adapter.update(frame);
    this.renderer.resetState();
    const start = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.adapter.afterRender(frame, performance.now() - start);
    this.renderer.resetState();
    if (!document.hidden) this.map.triggerRepaint();
  }
  onRemove() {
    if (this.removed) return;
    this.removed = true;
    this.adapter.dispose();
    this.scene.clear();
    // Never forceContextLoss(): this context belongs to MapLibre.
    this.renderer?.dispose();
    this.renderer = undefined;
    this.map = undefined;
  }
}
