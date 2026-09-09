import { afterEach, describe, expect, it, vi } from 'vitest';
import { Scene, Camera } from 'three';
const renderer = vi.hoisted(() => ({
  autoClear: true,
  resetState: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: vi.fn(function () {
    return renderer;
  }),
}));
import { ThreeMapLayer, type SceneAdapter } from '@/shared/lib/three/ThreeMapLayer';
import type { CustomRenderMethodInput, Map as LibreMap } from 'maplibre-gl';
describe('MapLibre custom layer integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  it('attaches, follows the map render pipeline, and cleans up once', () => {
    vi.stubGlobal('document', { hidden: false });
    const adapter: SceneAdapter = {
      attach: vi.fn(),
      update: vi.fn(),
      afterRender: vi.fn(),
      dispose: vi.fn(),
    };
    const map = { getCanvas: () => ({}), triggerRepaint: vi.fn() } as unknown as LibreMap;
    const layer = new ThreeMapLayer(adapter);
    layer.onAdd(map, {} as WebGL2RenderingContext);
    expect(adapter.attach).toHaveBeenCalledWith(expect.any(Scene), map);
    expect(renderer.autoClear).toBe(false);
    layer.render(
      {} as WebGL2RenderingContext,
      {
        defaultProjectionData: { mainMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
      } as unknown as CustomRenderMethodInput,
    );
    expect(adapter.update).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.any(Camera), map }),
    );
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(adapter.afterRender).toHaveBeenCalledTimes(1);
    expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
    layer.onRemove();
    layer.onRemove();
    expect(adapter.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});
