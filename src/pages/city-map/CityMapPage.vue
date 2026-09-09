<script setup lang="ts">
import { ref } from 'vue';
import MapScene from '@/widgets/map-scene/MapScene.vue';
import LayerPanel from '@/widgets/layer-panel/LayerPanel.vue';
import PerformancePanel from '@/widgets/performance-panel/PerformancePanel.vue';
import VehicleDetails from '@/widgets/vehicle-details/VehicleDetails.vue';
import { useSceneSettings } from '@/features/scene-settings';
const settings = useSceneSettings();
const panelOpen = ref(false);
</script>
<template>
  <div class="city-app">
    <header class="app-header">
      <a class="brand" href="#/" aria-label="CityFlow 3D — главная"
        ><span class="brand-mark">CF</span>CityFlow <span class="brand-dimension">3D</span></a
      ><span class="header-label">ГОРОДСКОЙ ТРАФИК</span>
      <div class="header-status">
        <span class="live-dot" :class="{ inactive: !settings.ready || settings.paused }"></span
        >{{
          settings.ready ? (settings.paused ? 'Пауза' : 'Симуляция активна') : 'Подготовка сцены'
        }}
      </div>
      <button
        class="mobile-panel-toggle"
        :aria-expanded="panelOpen"
        aria-controls="scene-controls"
        @click="panelOpen = !panelOpen"
      >
        {{ panelOpen ? 'Закрыть' : 'Настройки' }}
      </button>
    </header>
    <main class="workspace">
      <div id="scene-controls" class="controls-container" :class="{ open: panelOpen }">
        <LayerPanel />
      </div>
      <div class="scene-workspace">
        <MapScene />
        <div class="scene-panels"><PerformancePanel /><VehicleDetails /></div>
        <div v-if="!settings.selected" class="selection-hint">
          Нажмите на автомобиль, чтобы посмотреть его параметры
        </div>
      </div>
    </main>
    <footer class="status-bar">
      <span><i class="live-dot"></i>{{ settings.count.toLocaleString('ru-RU') }} машин</span
      ><span>{{ settings.metrics.fps.toFixed(0) }} FPS</span
      ><span>{{ settings.metrics.frameMs.toFixed(1) }} мс / кадр</span
      ><span class="footer-pipeline">MapLibre → Three.js → WebGL 2</span
      ><span class="demo-badge">DEMO DATA</span>
    </footer>
  </div>
</template>
