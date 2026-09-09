import { Map, NavigationControl, ScaleControl, type StyleSpecification } from 'maplibre-gl';
import { MAP_CENTER, MAP_PITCH, MAP_ZOOM } from '@/shared/config/map';
export function createMap(container: HTMLElement, dpr: number) {
  const style: StyleSpecification = {
    version: 8,
    transition: { duration: 650, delay: 0 },
    sources: {
      basemap: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
      routes: { type: 'geojson', data: `${import.meta.env.BASE_URL}data/routes.geojson` },
      buildings: {
        type: 'geojson',
        data: `${import.meta.env.BASE_URL}data/buildings.geojson`,
        attribution:
          'Улицы и здания: <a href="https://openfreemap.org">OpenFreeMap</a> / <a href="https://openmaptiles.org">OpenMapTiles</a> / © OpenStreetMap',
      },
      'time-tint': {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [30, 50],
                [45, 50],
                [45, 62],
                [30, 62],
                [30, 50],
              ],
            ],
          },
        },
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#202d32' } },
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
        paint: {
          'raster-saturation': -0.2,
          'raster-contrast': 0.08,
          'raster-opacity': 0.9,
          'raster-fade-duration': 0,
          'raster-saturation-transition': { duration: 650, delay: 0 },
          'raster-contrast-transition': { duration: 650, delay: 0 },
          'raster-hue-rotate-transition': { duration: 650, delay: 0 },
          'raster-brightness-min-transition': { duration: 650, delay: 0 },
          'raster-brightness-max-transition': { duration: 650, delay: 0 },
        },
      },
      {
        id: 'time-tint',
        type: 'fill',
        source: 'time-tint',
        paint: {
          'fill-color': '#d8f2ed',
          'fill-opacity': 0.04,
          'fill-color-transition': { duration: 650, delay: 0 },
          'fill-opacity-transition': { duration: 650, delay: 0 },
        },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: 'routes',
        paint: { 'line-color': '#213a42', 'line-width': 14 },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'routes',
        paint: { 'line-color': '#4c646b', 'line-width': 9 },
      },
      {
        id: 'buildings',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': '#71858a',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.65,
        },
      },
    ],
  };
  const map = new Map({
    container,
    style,
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    pitch: MAP_PITCH,
    bearing: -20,
    maxPitch: 75,
    minZoom: 11,
    maxZoom: 20,
    pixelRatio: dpr,
    canvasContextAttributes: { antialias: true, contextType: 'webgl2' },
    attributionControl: { compact: true },
  });
  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
  return map;
}
