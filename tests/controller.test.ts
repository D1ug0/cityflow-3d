import { describe, expect, it, vi } from 'vitest';
import { Scene } from 'three';
import type { Map as LibreMap } from 'maplibre-gl';
import { SceneController, type SceneOptions } from '@/widgets/map-scene/SceneController';
import { VehicleRenderer } from '@/entities/vehicle/VehicleRenderer';
import type { Route } from '@/entities/route';
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
const options: SceneOptions = {
  quality: 'high',
  count: 1000,
  traffic: true,
  buildings: true,
  flow: true,
  rain: false,
  paused: false,
  adaptive: false,
  time: 'day',
};
describe('scene controls lifecycle', () => {
  it('reuses objects for toggles, replaces the fleet for count changes and detaches events', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    const model = vi.spyOn(VehicleRenderer.prototype, 'loadModel').mockResolvedValue();
    const dispose = vi.spyOn(VehicleRenderer.prototype, 'dispose');
    const map = {
      setPixelRatio: vi.fn(),
      getPixelRatio: () => 2,
      getLayer: () => true,
      setLayoutProperty: vi.fn(),
      setPaintProperty: vi.fn(),
      triggerRepaint: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as LibreMap;
    const callbacks = { metrics: vi.fn(), selection: vi.fn(), quality: vi.fn(), warning: vi.fn() };
    const controller = new SceneController([route], options, callbacks);
    const scene = new Scene();
    controller.attach(scene, map);
    const children = [...scene.children];
    for (let i = 0; i < 10; i++) {
      controller.configure({ ...options, traffic: false, rain: true });
      controller.configure(options);
    }
    expect(scene.children).toEqual(children);
    expect(model).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
    controller.configure({ ...options, count: 5000 });
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(model).toHaveBeenCalledTimes(2);
    controller.dispose();
    controller.dispose();
    expect(dispose).toHaveBeenCalledTimes(2);
    expect(map.off).toHaveBeenCalledWith('click', expect.any(Function));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
