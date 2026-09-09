import { describe, expect, it } from 'vitest';
import { QualityManager } from '@/shared/lib/performance/QualityManager';
import { FrameBudget, PerformanceMonitor } from '@/shared/lib/performance/PerformanceMonitor';
import { pixelRatio, selectLod } from '@/shared/config/graphics';
describe('adaptive quality', () => {
  it('requires three seconds of continuous low FPS before a downgrade', () => {
    const q = new QualityManager();
    expect(q.update(38, 0, 'high')).toBe('high');
    expect(q.update(38, 2999, 'high')).toBe('high');
    expect(q.update(38, 3000, 'high')).toBe('medium');
    expect(q.update(20, 4000, 'medium')).toBe('medium');
  });
  it('resets a low-FPS streak after recovery', () => {
    const q = new QualityManager();
    q.update(38, 0, 'high');
    q.update(60, 2000, 'high');
    expect(q.update(38, 3000, 'high')).toBe('high');
    expect(q.update(38, 6000, 'high')).toBe('medium');
  });
  it('waits for cooldown and twenty seconds of high FPS to upgrade', () => {
    const q = new QualityManager();
    q.reset(0);
    expect(q.update(60, 1000, 'low')).toBe('low');
    q.update(60, 8000, 'low');
    expect(q.update(60, 27999, 'low')).toBe('low');
    expect(q.update(60, 28000, 'low')).toBe('medium');
  });
  it('uses a lower downgrade threshold for medium', () => {
    const q = new QualityManager();
    q.update(38, 0, 'medium');
    expect(q.update(38, 4000, 'medium')).toBe('medium');
    q.update(25, 5000, 'medium');
    expect(q.update(25, 8000, 'medium')).toBe('low');
  });
});
describe('frame statistics and presets', () => {
  it('computes frame budgets', () => {
    const b = new FrameBudget();
    expect(b.milliseconds).toBeCloseTo(16.6667);
    expect(b.exceeded(20)).toBe(true);
    expect(new FrameBudget(30).exceeded(30)).toBe(false);
  });
  it('uses a bounded rolling window and excludes long background intervals', () => {
    const m = new PerformanceMonitor();
    m.record(1);
    expect(m.record(21).fps).toBe(50);
    expect(m.record(2021).fps).toBe(50);
    let result;
    for (let i = 1; i <= 121; i++) result = m.record(2021 + i * 10);
    expect(result?.fps).toBe(100);
    m.reset();
    expect(m.record(9999).fps).toBe(0);
  });
  it('caps DPR and detail by quality and zoom', () => {
    expect(pixelRatio('low', 3)).toBe(1);
    expect(pixelRatio('medium', 3)).toBe(1.5);
    expect(pixelRatio('high', 1.25)).toBe(1.25);
    expect(pixelRatio('high', NaN)).toBe(1);
    expect(selectLod(18, 'low')).toBe(0);
    expect(selectLod(15, 'high')).toBe(1);
    expect(selectLod(18, 'high')).toBe(2);
  });
});
