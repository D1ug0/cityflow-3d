import { describe, expect, it, vi } from 'vitest';
import type { Map as LibreMap } from 'maplibre-gl';
import { applyMapTheme, MAP_THEMES } from '@/shared/lib/maplibre/apply-map-theme';
import { rainMaterial } from '@/shared/lib/three/shaders';

describe('map time themes', () => {
  it.each(['day', 'sunset', 'night'] as const)('applies the complete %s palette', (time) => {
    const setPaintProperty = vi.fn();
    applyMapTheme({ setPaintProperty } as unknown as LibreMap, time);

    expect(setPaintProperty).toHaveBeenCalledWith(
      'time-tint',
      'fill-opacity',
      MAP_THEMES[time].tintOpacity,
    );
    expect(setPaintProperty).toHaveBeenCalledWith(
      'basemap',
      'raster-brightness-max',
      MAP_THEMES[time].brightnessMax,
    );
    expect(setPaintProperty).toHaveBeenCalledWith(
      'buildings',
      'fill-extrusion-color',
      MAP_THEMES[time].building,
    );
  });

  it('uses visibly distinct tint and brightness values', () => {
    expect(MAP_THEMES.day.tintOpacity).toBeLessThan(MAP_THEMES.sunset.tintOpacity);
    expect(MAP_THEMES.sunset.tintOpacity).toBeLessThan(MAP_THEMES.night.tintOpacity);
    expect(MAP_THEMES.day.brightnessMax).toBeGreaterThan(MAP_THEMES.sunset.brightnessMax);
    expect(MAP_THEMES.sunset.brightnessMax).toBeGreaterThan(MAP_THEMES.night.brightnessMax);
  });
});

describe('rain coordinates', () => {
  it('keeps drops in world coordinates instead of following the map center', () => {
    const material = rainMaterial();
    expect(material.uniforms).not.toHaveProperty('uCenter');
    expect(material.vertexShader).not.toContain('uCenter');
    material.dispose();
  });
});
