export type Quality = 'low' | 'medium' | 'high';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export const VEHICLE_COUNTS = [100, 1000, 5000, 10000] as const;
export const GRAPHICS = {
  low: { dpr: 1, rain: 1000, detail: 0 },
  medium: { dpr: 1.5, rain: 5000, detail: 1 },
  high: { dpr: 2, rain: 10000, detail: 2 },
} as const;
export function pixelRatio(quality: Quality, deviceDpr: number): number {
  return Math.max(1, Math.min(Number.isFinite(deviceDpr) ? deviceDpr : 1, GRAPHICS[quality].dpr));
}
export function selectLod(zoom: number, quality: Quality): number {
  return Math.min(GRAPHICS[quality].detail, zoom < 14 ? 0 : zoom < 16 ? 1 : 2);
}
