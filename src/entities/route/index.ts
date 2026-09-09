import { toLocal } from '@/shared/lib/maplibre/coordinates';
export interface Route {
  id: string;
  name: string;
  points: [number, number][];
  distances: Float64Array;
  length: number;
}
export interface RouteSample {
  x: number;
  y: number;
  heading: number;
}
export function parseRoutes(data: unknown): Route[] {
  if (
    !data ||
    typeof data !== 'object' ||
    !('type' in data) ||
    data.type !== 'FeatureCollection' ||
    !('features' in data) ||
    !Array.isArray(data.features)
  )
    throw new Error('Ожидался GeoJSON FeatureCollection.');
  const ids = new Set<string>();
  const routes: Route[] = data.features.map((feature) => {
    const coords: unknown = feature?.geometry?.coordinates;
    const id: unknown = feature?.properties?.id;
    if (
      feature?.geometry?.type !== 'LineString' ||
      !Array.isArray(coords) ||
      coords.length < 2 ||
      typeof id !== 'string' ||
      ids.has(id)
    )
      throw new Error(
        'Маршрут должен содержать уникальный id и LineString из двух или более точек.',
      );
    ids.add(id);
    const points: [number, number][] = coords.map((p: unknown) => {
      if (
        !Array.isArray(p) ||
        p.length < 2 ||
        !Number.isFinite(p[0]) ||
        !Number.isFinite(p[1]) ||
        Math.abs(p[0]) > 180 ||
        Math.abs(p[1]) > 85
      )
        throw new Error('Некорректные координаты маршрута.');
      return toLocal(p[0], p[1]);
    });
    const distances = new Float64Array(points.length);
    for (let i = 1; i < points.length; i++) {
      const segment = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      if (segment < 0.01) throw new Error('Маршрут содержит совпадающие соседние точки.');
      distances[i] = distances[i - 1] + segment;
    }
    return {
      id,
      name: String(feature.properties.name ?? id),
      points,
      distances,
      length: distances[distances.length - 1],
    };
  });
  if (!routes.length) throw new Error('Список маршрутов пуст.');
  return routes;
}
export function sampleRoute(route: Route, progress: number, target: RouteSample): RouteSample {
  const distance = (((progress % 1) + 1) % 1) * route.length;
  let lo = 1,
    hi = route.distances.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (route.distances[mid] < distance) lo = mid + 1;
    else hi = mid;
  }
  const a = route.points[lo - 1],
    b = route.points[lo];
  const t = (distance - route.distances[lo - 1]) / (route.distances[lo] - route.distances[lo - 1]);
  target.x = a[0] + (b[0] - a[0]) * t;
  target.y = a[1] + (b[1] - a[1]) * t;
  target.heading = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return target;
}
