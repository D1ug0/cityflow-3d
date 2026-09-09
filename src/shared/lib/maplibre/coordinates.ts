import { MercatorCoordinate } from 'maplibre-gl';
import { MAP_CENTER } from '@/shared/config/map';
export const origin = MercatorCoordinate.fromLngLat(MAP_CENTER);
export const meterScale = origin.meterInMercatorCoordinateUnits();
// Local axes: east +X, north +Y, altitude +Z (metres around the scene origin).
export function toLocal(lng: number, lat: number): [number, number] {
  const point = MercatorCoordinate.fromLngLat([lng, lat]);
  return [(point.x - origin.x) / meterScale, (origin.y - point.y) / meterScale];
}
export function toLngLat(x: number, y: number): [number, number] {
  const point = new MercatorCoordinate(
    origin.x + x * meterScale,
    origin.y - y * meterScale,
  ).toLngLat();
  return [point.lng, point.lat];
}
