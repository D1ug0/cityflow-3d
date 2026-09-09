<script setup lang="ts">
import { useSceneSettings } from '@/features/scene-settings';
const settings = useSceneSettings();
</script>
<template>
  <section
    v-if="settings.selected"
    class="vehicle-details"
    aria-label="Выбранный автомобиль"
    aria-live="polite"
  >
    <div class="panel-title">
      <span>Выбранный автомобиль</span
      ><button
        class="icon-button"
        aria-label="Снять выбор автомобиля"
        @click="settings.selected = null"
      >
        ×
      </button>
    </div>
    <h2>{{ settings.selected.id }}</h2>
    <span class="vehicle-status">{{
      settings.selected.status === 'paused' ? 'Пауза' : 'В движении'
    }}</span>
    <dl class="vehicle-info">
      <dt>Скорость</dt>
      <dd>
        {{ settings.selected.status === 'paused' ? 0 : settings.selected.speed.toFixed(0) }}
        <small>км/ч</small>
      </dd>
      <dt>Маршрут</dt>
      <dd>{{ settings.selected.route }}</dd>
      <dt>Тип</dt>
      <dd>{{ settings.selected.type }}</dd>
    </dl>
    <label for="route-progress"
      >Пройдено по маршруту
      <strong>{{ (settings.selected.progress * 100).toFixed(0) }}%</strong></label
    ><progress id="route-progress" :value="settings.selected.progress" max="1"></progress>
  </section>
</template>
