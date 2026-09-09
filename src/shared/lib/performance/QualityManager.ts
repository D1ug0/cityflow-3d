import type { Quality } from '@/shared/config/graphics';
export class QualityManager {
  private slowSince: number | null = null;
  private fastSince: number | null = null;
  private lastChange = -Infinity;
  reset(now = 0) {
    this.slowSince = this.fastSince = null;
    this.lastChange = now;
  }
  update(fps: number, now: number, current: Quality): Quality {
    if (fps <= 0 || now - this.lastChange < 8000) return current;
    const slow = fps < (current === 'high' ? 45 : 30);
    const fast = fps > 57;
    this.slowSince = slow ? (this.slowSince ?? now) : null;
    this.fastSince = fast ? (this.fastSince ?? now) : null;
    let next = current;
    if (this.slowSince !== null && now - this.slowSince >= 3000)
      next = current === 'high' ? 'medium' : 'low';
    else if (this.fastSince !== null && now - this.fastSince >= 20000)
      next = current === 'low' ? 'medium' : 'high';
    if (next !== current) this.reset(now);
    return next;
  }
}
