<script setup lang="ts">
import { useSceneSettings } from '@/features/scene-settings';
import { VEHICLE_COUNTS, type Quality, type TimeOfDay } from '@/shared/config/graphics';

const settings = useSceneSettings();
const qualities: { id: Quality; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];
const times: { id: TimeOfDay; label: string; icon: string }[] = [
  { id: 'day', label: 'День', icon: '☀' },
  { id: 'sunset', label: 'Закат', icon: '◒' },
  { id: 'night', label: 'Ночь', icon: '☾' },
];
</script>

<template>
  <aside class="layer-panel">
    <div class="panel-title">
      <span>Управление сценой</span><span class="section-index">01</span>
    </div>

    <section class="settings-group" aria-labelledby="layers-heading">
      <h2 id="layers-heading">Слои</h2>
      <label class="toggle-row">
        <span><b>Транспорт</b><small>3D-автомобили на маршрутах</small></span>
        <input v-model="settings.traffic" type="checkbox" role="switch" />
      </label>
      <label class="toggle-row">
        <span><b>Здания</b><small>Контуры OpenStreetMap</small></span>
        <input v-model="settings.buildings" type="checkbox" role="switch" />
      </label>
      <label class="toggle-row">
        <span><b>Поток движения</b><small>Анимированные направления</small></span>
        <input v-model="settings.flow" type="checkbox" role="switch" />
      </label>
      <label class="toggle-row">
        <span><b>Дождь</b><small>GPU-частицы</small></span>
        <input v-model="settings.rain" type="checkbox" role="switch" />
      </label>
    </section>

    <section class="settings-group" aria-labelledby="time-heading">
      <h2 id="time-heading">Время суток</h2>
      <div class="segments time-segments" role="group" aria-labelledby="time-heading">
        <button
          v-for="item in times"
          :key="item.id"
          type="button"
          :aria-pressed="settings.time === item.id"
          @click="settings.time = item.id"
        >
          <span>{{ item.icon }}</span
          >{{ item.label }}
        </button>
      </div>
    </section>

    <section class="settings-group" aria-labelledby="quality-heading">
      <h2 id="quality-heading">Качество графики</h2>
      <div class="segments" role="group" aria-labelledby="quality-heading">
        <button
          v-for="item in qualities"
          :key="item.id"
          type="button"
          :aria-pressed="settings.quality === item.id"
          @click="settings.quality = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <label class="toggle-row compact">
        <span>Автоподбор качества</span>
        <input v-model="settings.adaptive" type="checkbox" role="switch" />
      </label>
    </section>

    <section class="settings-group" aria-labelledby="load-heading">
      <h2 id="load-heading">Нагрузка</h2>
      <label class="count-label" for="vehicle-count">
        <span>Автомобили</span>
        <strong>{{ settings.count.toLocaleString('ru-RU') }}</strong>
      </label>
      <select id="vehicle-count" v-model.number="settings.count">
        <option v-for="count in VEHICLE_COUNTS" :key="count" :value="count">
          {{ count.toLocaleString('ru-RU') }} автомобилей
        </option>
      </select>
      <p class="field-hint">Нагрузка задаёт плотность демонстрационного потока.</p>
    </section>

    <button
      type="button"
      class="pause-button"
      :aria-pressed="settings.paused"
      @click="settings.paused = !settings.paused"
    >
      {{ settings.paused ? '▶ Продолжить движение' : 'Ⅱ Приостановить движение' }}
    </button>
    <label class="toggle-row compact debug-toggle">
      <span>Панель производительности</span>
      <input v-model="settings.debug" type="checkbox" role="switch" />
    </label>
    <p class="panel-footnote">
      Маршруты по улицам OpenStreetMap.<br />Без реальных данных о пробках.
    </p>
  </aside>
</template>
