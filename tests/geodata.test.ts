import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type {
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
} from 'geojson';
const routes = JSON.parse(
  readFileSync('public/data/routes.geojson', 'utf8'),
) as FeatureCollection<LineString>;
const buildings = JSON.parse(
  readFileSync('public/data/buildings.geojson', 'utf8'),
) as FeatureCollection<Polygon | MultiPolygon>;
const extract = JSON.parse(
  gunzipSync(readFileSync('data/moscow-map-extract.json.gz')).toString(),
) as { features: { transportation: FeatureCollection<LineString | MultiLineString>['features'] } };
const key = (point: number[]) => point.map((value) => value.toFixed(8)).join(',');
const sx = 111320 * Math.cos((55.758 * Math.PI) / 180);
const local = (p: number[]) => [(p[0] - 37.608) * sx, (p[1] - 55.758) * 111320];
function inside(p: number[], ring: number[][]) {
  let hit = false;
  for (let i = 1; i < ring.length; i++) {
    const a = ring[i - 1],
      b = ring[i];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}
function distance(p: number[], a: number[], b: number[]) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    denominator = dx * dx + dy * dy;
  const t = denominator
    ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / denominator))
    : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
describe('street-aligned prepared routes', () => {
  it('uses only original road segments in their allowed direction, including loop closure', () => {
    const edges = new Set<string>();
    for (const feature of extract.features.transportation) {
      const lines =
        feature.geometry.type === 'LineString'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;
      for (const line of lines)
        for (let i = 1; i < line.length; i++) {
          const a = key(line[i - 1]),
            b = key(line[i]);
          if (feature.properties?.oneway !== -1) edges.add(`${a}|${b}`);
          if (feature.properties?.oneway !== 1) edges.add(`${b}|${a}`);
        }
    }
    for (const route of routes.features) {
      const points = route.geometry.coordinates;
      expect(points[0]).toEqual(points.at(-1));
      expect(points.length).toBeGreaterThan(20);
      for (let i = 1; i < points.length; i++)
        expect(
          edges.has(`${key(points[i - 1])}|${key(points[i])}`),
          `${route.properties?.id} segment ${i} must follow a source street`,
        ).toBe(true);
    }
  });
  it('keeps routes and vehicle-sized clearance outside the building footprints', () => {
    const polygons = buildings.features.flatMap((f) =>
      (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(
        (p) => {
          const rings = p.map((r) => r.map(local));
          const outer = rings[0];
          return {
            rings,
            minX: Math.min(...outer.map((p) => p[0])) - 3,
            minY: Math.min(...outer.map((p) => p[1])) - 3,
            maxX: Math.max(...outer.map((p) => p[0])) + 3,
            maxY: Math.max(...outer.map((p) => p[1])) + 3,
          };
        },
      ),
    );
    for (const route of routes.features) {
      const points = route.geometry.coordinates.map(local);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
        for (let j = 0; j <= steps; j++) {
          const p = [a[0] + ((b[0] - a[0]) * j) / steps, a[1] + ((b[1] - a[1]) * j) / steps];
          for (const polygon of polygons) {
            if (
              p[0] < polygon.minX ||
              p[0] > polygon.maxX ||
              p[1] < polygon.minY ||
              p[1] > polygon.maxY
            )
              continue;
            expect(
              inside(p, polygon.rings[0]) && !polygon.rings.slice(1).some((r) => inside(p, r)),
              `${route.properties?.id} inside building`,
            ).toBe(false);
            for (const ring of polygon.rings)
              for (let k = 1; k < ring.length; k++)
                expect(
                  distance(p, ring[k - 1], ring[k]),
                  'vehicle clearance from building',
                ).toBeGreaterThan(2.5);
          }
        }
      }
    }
  }, 15_000);
});
