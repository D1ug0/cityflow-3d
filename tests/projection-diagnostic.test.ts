import { it, expect } from 'vitest';
import { Matrix4, Vector3 } from 'three';
import { readFileSync } from 'node:fs';
import camera from './fixtures/moscow-camera.json';
import { origin, meterScale } from '@/shared/lib/maplibre/coordinates';
import { parseRoutes } from '@/entities/route';
import { VehicleRenderer } from '@/entities/vehicle/VehicleRenderer';
import { VehicleSimulation } from '@/entities/vehicle';
it('keeps moving vehicles visible with the actual MapLibre startup projection', () => {
  const matrix = new Matrix4()
    .fromArray(camera.mainMatrix)
    .multiply(
      new Matrix4()
        .makeTranslation(origin.x, origin.y, origin.z)
        .scale(new Vector3(meterScale, -meterScale, meterScale)),
    );
  const center = new Vector3().applyMatrix4(matrix);
  expect(center.x).toBeCloseTo(0, 6);
  expect(center.y).toBeCloseTo(0, 6);
  const simulation = new VehicleSimulation(
    parseRoutes(JSON.parse(readFileSync('public/data/routes.geojson', 'utf8'))),
    1000,
  );
  const vehicles = new VehicleRenderer(simulation);
  expect(vehicles.update(matrix, 1)).toBeGreaterThan(100);
  const before = new Matrix4();
  vehicles.mesh.getMatrixAt(0, before);
  const id = vehicles.visibleIds[0];
  for (let i = 0; i < 60; i++) simulation.update(1 / 60);
  vehicles.update(matrix, 1);
  const index = vehicles.visibleIds.subarray(0, vehicles.mesh.count).indexOf(id);
  expect(index).toBeGreaterThanOrEqual(0);
  const after = new Matrix4();
  vehicles.mesh.getMatrixAt(index, after);
  expect(
    new Vector3()
      .setFromMatrixPosition(before)
      .distanceTo(new Vector3().setFromMatrixPosition(after)),
  ).toBeGreaterThan(5);
  vehicles.dispose();
});
