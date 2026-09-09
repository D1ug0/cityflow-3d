import type { Map as LibreMap } from 'maplibre-gl';
import type { TimeOfDay } from '@/shared/config/graphics';

interface MapTheme {
  background: string;
  tint: string;
  tintOpacity: number;
  saturation: number;
  contrast: number;
  hue: number;
  brightnessMin: number;
  brightnessMax: number;
  roadCasing: string;
  road: string;
  building: string;
  buildingOpacity: number;
}

export const MAP_THEMES: Record<TimeOfDay, MapTheme> = {
  day: {
    background: '#b8c6c5',
    tint: '#d8f2ed',
    tintOpacity: 0.04,
    saturation: -0.2,
    contrast: 0.08,
    hue: 0,
    brightnessMin: 0.08,
    brightnessMax: 1,
    roadCasing: '#294047',
    road: '#5b7278',
    building: '#788d91',
    buildingOpacity: 0.66,
  },
  sunset: {
    background: '#3c302d',
    tint: '#d86f42',
    tintOpacity: 0.28,
    saturation: 0.3,
    contrast: 0.18,
    hue: -18,
    brightnessMin: 0.05,
    brightnessMax: 0.76,
    roadCasing: '#482e2a',
    road: '#8e6558',
    building: '#9a675a',
    buildingOpacity: 0.72,
  },
  night: {
    background: '#07131d',
    tint: '#071d35',
    tintOpacity: 0.66,
    saturation: -0.72,
    contrast: 0.34,
    hue: 28,
    brightnessMin: 0,
    brightnessMax: 0.42,
    roadCasing: '#081c2b',
    road: '#24475a',
    building: '#22384a',
    buildingOpacity: 0.82,
  },
};

export function applyMapTheme(map: LibreMap, time: TimeOfDay): void {
  const theme = MAP_THEMES[time];

  map.setPaintProperty('background', 'background-color', theme.background);
  map.setPaintProperty('basemap', 'raster-saturation', theme.saturation);
  map.setPaintProperty('basemap', 'raster-contrast', theme.contrast);
  map.setPaintProperty('basemap', 'raster-hue-rotate', theme.hue);
  map.setPaintProperty('basemap', 'raster-brightness-min', theme.brightnessMin);
  map.setPaintProperty('basemap', 'raster-brightness-max', theme.brightnessMax);
  map.setPaintProperty('time-tint', 'fill-color', theme.tint);
  map.setPaintProperty('time-tint', 'fill-opacity', theme.tintOpacity);
  map.setPaintProperty('road-casing', 'line-color', theme.roadCasing);
  map.setPaintProperty('roads', 'line-color', theme.road);
  map.setPaintProperty('buildings', 'fill-extrusion-color', theme.building);
  map.setPaintProperty('buildings', 'fill-extrusion-opacity', theme.buildingOpacity);
}
