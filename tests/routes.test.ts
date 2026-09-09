import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRoutes, sampleRoute, type Route } from '@/entities/route';
import { VehicleSimulation } from '@/entities/vehicle';
import { toLocal, toLngLat } from '@/shared/lib/maplibre/coordinates';
const route: Route = {
  id: 'test',
  name: 'test',
  points: [
    [0, 0],
    [100, 0],
    [100, 100],
  ],
  distances: new Float64Array([0, 100, 200]),
  length: 200,
};
const sample = () => ({ x: 0, y: 0, heading: 0 });
describe('route interpolation', () => {
  it('uses travelled distance, including corner headings', () => {
    expect(sampleRoute(route, 0.25, sample())).toEqual({ x: 50, y: 0, heading: 0 });
    expect(sampleRoute(route, 0.75, sample())).toEqual({ x: 100, y: 50, heading: Math.PI / 2 });
  });
  it('wraps forward and negative progress', () => {
    expect(sampleRoute(route, 1.25, sample()).x).toBe(50);
    expect(sampleRoute(route, -0.25, sample()).y).toBe(50);
  });
  it('converts km/h into metres per second and limits background jumps', () => {
    const simulation = new VehicleSimulation([route], 1);
    simulation.speeds[0] = 36;
    simulation.update(0.1);
    expect(simulation.progress[0]).toBeCloseTo(1 / 200);
    simulation.update(60);
    expect(simulation.progress[0]).toBeCloseTo(2 / 200);
    simulation.update(-1);
    expect(simulation.progress[0]).toBeCloseTo(2 / 200);
  });
  it('round-trips local and geographical coordinates', () => {
    const local = toLocal(37.615, 55.761);
    const point = toLngLat(...local);
    expect(point[0]).toBeCloseTo(37.615, 7);
    expect(point[1]).toBeCloseTo(55.761, 7);
  });
});
describe('GeoJSON', () => {
  const data = JSON.parse(readFileSync('public/data/routes.geojson', 'utf8'));
  it('loads all local routes as closed loops with positive lengths', () => {
    const routes = parseRoutes(data);
    expect(routes.length).toBe(4);
    for (const r of routes) {
      expect(r.length).toBeGreaterThan(100);
      expect(r.points[0]).toEqual(r.points.at(-1));
    }
  });
  it('rejects missing features and empty collections', () => {
    expect(() => parseRoutes(null)).toThrow();
    expect(() => parseRoutes({ type: 'FeatureCollection', features: [] })).toThrow();
  });
  it('rejects invalid geometry, coordinates, duplicates and zero-length segments', () => {
    for (const change of [
      (f: typeof data.features) => {
        f[0].geometry.type = 'Point';
      },
      (f: typeof data.features) => {
        f[0].geometry.coordinates[0] = [Infinity, 55];
      },
      (f: typeof data.features) => {
        f[1].properties.id = f[0].properties.id;
      },
      (f: typeof data.features) => {
        f[0].geometry.coordinates[1] = f[0].geometry.coordinates[0];
      },
    ]) {
      const bad = structuredClone(data);
      change(bad.features);
      expect(() => parseRoutes(bad)).toThrow();
    }
  });
  it.each([100, 1000, 5000, 10000])('updates %i vehicles with finite state', (count) => {
    const sim = new VehicleSimulation(parseRoutes(data), count);
    for (let frame = 0; frame < 120; frame++) sim.update(1 / 60);
    for (let i = 0; i < count; i++) {
      expect(sim.progress[i]).toBeGreaterThanOrEqual(0);
      expect(sim.progress[i]).toBeLessThan(1);
    }
    expect(Number.isFinite(sim.position(count - 1).x)).toBe(true);
  });
});
