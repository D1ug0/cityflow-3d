import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createVehicleGeometry } from '@/entities/vehicle/create-vehicle-geometry';

describe('vehicle LOD geometry', () => {
  it.each(['low', 'medium'] as const)(
    'keeps a recognizable car silhouette in %s quality',
    (level) => {
      const geometry = createVehicleGeometry(level);
      const position = geometry.getAttribute('position');

      expect(position.count).toBeGreaterThan(36);
      expect(geometry.getAttribute('color').count).toBe(position.count);
      expect(geometry.boundingBox).not.toBeNull();

      const size = geometry.boundingBox!.getSize(new Vector3());
      expect(size.x).toBeGreaterThan(size.y * 2);
      expect(size.z).toBeGreaterThan(1.5);
      geometry.dispose();
    },
  );

  it('adds more shape detail in medium quality', () => {
    const low = createVehicleGeometry('low');
    const medium = createVehicleGeometry('medium');
    expect(medium.getAttribute('position').count).toBeGreaterThan(
      low.getAttribute('position').count,
    );
    low.dispose();
    medium.dispose();
  });
});
