import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  type ColorRepresentation,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function paint(geometry: BufferGeometry, colorValue: ColorRepresentation): BufferGeometry {
  const color = new Color(colorValue);
  const count = geometry.getAttribute('position').count;
  const values = new Float32Array(count * 3);

  for (let index = 0; index < count; index++) color.toArray(values, index * 3);
  geometry.setAttribute('color', new Float32BufferAttribute(values, 3));
  return geometry;
}

function carParts(wheelSegments: number, details: boolean): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    paint(new BoxGeometry(4.4, 1.85, 0.72).translate(0, 0, 0.78), 0xffffff),
    paint(new BoxGeometry(2.15, 1.58, 0.66).translate(-0.28, 0, 1.45), 0x78919c),
  ];

  for (const x of [-1.35, 1.35]) {
    for (const y of [-0.97, 0.97]) {
      parts.push(
        paint(
          new CylinderGeometry(0.43, 0.43, 0.24, wheelSegments).translate(x, y, 0.52),
          0x14191d,
        ),
      );
    }
  }

  if (details) {
    for (const y of [-0.58, 0.58]) {
      parts.push(
        paint(new BoxGeometry(0.09, 0.34, 0.2).translate(2.23, y, 0.82), 0xffefae),
        paint(new BoxGeometry(0.09, 0.3, 0.18).translate(-2.23, y, 0.8), 0xc63636),
      );
    }
    parts.push(paint(new BoxGeometry(0.08, 1.46, 0.5).translate(0.82, 0, 1.46), 0x354957));
  }

  return parts;
}

export function createVehicleGeometry(level: 'low' | 'medium'): BufferGeometry {
  const parts = carParts(level === 'low' ? 6 : 10, level === 'medium');
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();

  if (!merged) throw new Error('Не удалось создать геометрию автомобиля.');
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}
