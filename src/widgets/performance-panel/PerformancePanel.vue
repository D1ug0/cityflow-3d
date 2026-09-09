<script setup lang="ts">
import { computed } from 'vue';
import { useSceneSettings } from '@/features/scene-settings';
import { FrameBudget } from '@/shared/lib/performance/PerformanceMonitor';
const settings = useSceneSettings();
const budget = new FrameBudget();
const overBudget = computed(() => budget.exceeded(settings.metrics.frameMs));
</script>
<template>
  <section v-if="settings.debug" class="performance-panel" aria-label="Производительность 3D-слоя">
    <div class="performance-heading">
      <span class="live-dot"></span> PERFORMANCE <span>{{ settings.quality.toUpperCase() }}</span>
    </div>
    <div class="fps-value" :class="{ slow: overBudget }">
      {{ settings.metrics.fps ? settings.metrics.fps.toFixed(0) : '—' }}<span>FPS</span>
    </div>
    <div class="budget-bar">
      <span
        :style="{
          width: Math.min(100, (settings.metrics.frameMs / 33.3) * 100) + '%',
          background: overBudget ? '#e8b66c' : '#6de0bf',
        }"
      ></span
      ><i></i>
    </div>
    <div class="budget-label">Бюджет 60 FPS <span>16,7 мс</span></div>
    <dl class="metrics-grid">
      <dt>Кадр · среднее</dt>
      <dd>{{ settings.metrics.frameMs.toFixed(1) }} мс</dd>
      <dt>Three · CPU submit</dt>
      <dd>{{ settings.metrics.renderMs.toFixed(2) }} мс</dd>
      <dt>Мин. FPS · окно</dt>
      <dd>{{ settings.metrics.minFps.toFixed(0) }}</dd>
      <dt>Draw calls · Three</dt>
      <dd>{{ settings.metrics.calls }}</dd>
      <dt>Треугольники</dt>
      <dd>{{ settings.metrics.triangles.toLocaleString('ru-RU') }}</dd>
      <dt>Геометрии / текстуры</dt>
      <dd>{{ settings.metrics.geometries }} / {{ settings.metrics.textures }}</dd>
      <dt>Видимые машины</dt>
      <dd>{{ settings.metrics.visible.toLocaleString('ru-RU') }}</dd>
      <dt>Pixel ratio</dt>
      <dd>{{ settings.metrics.dpr.toFixed(1) }}×</dd>
    </dl>
    <p class="field-hint">FPS по интервалам кадров. Счётчики ресурсов относятся к Three.js.</p>
  </section>
</template>
