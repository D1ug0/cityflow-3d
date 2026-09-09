import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import type { Quality, TimeOfDay } from '@/shared/config/graphics';
import { emptyMetrics } from '@/shared/lib/performance/PerformanceMonitor';
import type { VehicleDetails } from '@/entities/vehicle';
export const useSceneSettings = defineStore('scene-settings', () => {
  const quality = ref<Quality>(matchMedia('(pointer: coarse)').matches ? 'medium' : 'high');
  const count = ref(1000);
  const traffic = ref(true),
    buildings = ref(true),
    flow = ref(true),
    rain = ref(false);
  const paused = ref(false),
    adaptive = ref(true),
    time = ref<TimeOfDay>('day');
  const debug = ref(
    import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === 'true',
  );
  const selected = shallowRef<VehicleDetails | null>(null);
  const metrics = shallowRef(emptyMetrics());
  const ready = ref(false),
    error = ref(''),
    warning = ref('');
  return {
    quality,
    count,
    traffic,
    buildings,
    flow,
    rain,
    paused,
    adaptive,
    time,
    debug,
    selected,
    metrics,
    ready,
    error,
    warning,
  };
});
