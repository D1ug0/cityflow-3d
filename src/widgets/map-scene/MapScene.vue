<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Map as LibreMap } from 'maplibre-gl';
import { useSceneSettings } from '@/features/scene-settings';
import { parseRoutes } from '@/entities/route';
import { createMap } from '@/shared/lib/maplibre/create-map';
import { pixelRatio } from '@/shared/config/graphics';
import { MAP_CENTER, MAP_PITCH, MAP_ZOOM } from '@/shared/config/map';
import { ThreeMapLayer } from '@/shared/lib/three/ThreeMapLayer';
import { SceneController, type SceneOptions } from './SceneController';
const settings = useSceneSettings();
const container = ref<HTMLElement>();
let map: LibreMap | undefined,
  controller: SceneController | undefined,
  layer: ThreeMapLayer | undefined;
let disposed = false,
  timeout: ReturnType<typeof setTimeout> | undefined;
const abort = new AbortController();
let mountGeneration = 0;
const options = (): SceneOptions => ({
  quality: settings.quality,
  count: settings.count,
  traffic: settings.traffic,
  buildings: settings.buildings,
  flow: settings.flow,
  rain: settings.rain,
  paused: settings.paused,
  adaptive: settings.adaptive,
  time: settings.time,
});
watch(options, (value) => controller?.configure(value));
watch(
  () => settings.selected,
  (value) => {
    if (!value) controller?.clearSelection();
  },
);
const visibility = () => {
  controller?.resetTiming();
  if (!document.hidden) map?.triggerRepaint();
};
const contextLost = () => {
  settings.error = 'Графический контекст потерян. Ожидаем восстановления…';
};
const contextRestored = () => {
  settings.error = '';
  controller?.resetTiming();
  // Recreate the adapter as its previous GPU resources belonged to the lost context.
  if (map?.getLayer('cityflow-3d')) map.removeLayer('cityflow-3d');
  void mountLayer();
};
async function mountLayer() {
  const generation = ++mountGeneration;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/routes.geojson`, {
      signal: abort.signal,
    });
    if (!response.ok) throw new Error(`Ошибка загрузки маршрутов: HTTP ${response.status}`);
    const routes = parseRoutes(await response.json());
    if (disposed || !map || generation !== mountGeneration) return;
    controller = new SceneController(routes, options(), {
      metrics: (value) => {
        settings.metrics = value;
      },
      selection: (value) => {
        settings.selected = value;
      },
      quality: (value) => {
        settings.quality = value;
      },
      warning: (value) => {
        settings.warning = value;
      },
    });
    layer = new ThreeMapLayer(controller);
    map.addLayer(layer);
    settings.ready = true;
    settings.error = '';
    clearTimeout(timeout);
  } catch (error) {
    if (!disposed && generation === mountGeneration)
      settings.error = error instanceof Error ? error.message : 'Не удалось создать 3D-сцену.';
  }
}
onMounted(() => {
  try {
    if (!container.value) return;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl)
      throw new Error(
        'WebGL 2 недоступен. Включите аппаратное ускорение или используйте современный браузер.',
      );
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    map = createMap(container.value, pixelRatio(settings.quality, devicePixelRatio));
    // Local 3D data must not wait for slow or unreachable raster tiles.
    map.once('style.load', () => {
      void mountLayer();
    });
    map.on('error', (event) => {
      if ('sourceId' in event && event.sourceId === 'basemap')
        settings.warning =
          'Подложка OpenStreetMap недоступна. Локальные демонстрационные маршруты остаются доступны.';
      else settings.warning = `Ошибка карты: ${event.error.message}`;
    });
    map.on('webglcontextlost', contextLost);
    map.on('webglcontextrestored', contextRestored);
    document.addEventListener('visibilitychange', visibility);
    timeout = setTimeout(() => {
      if (!settings.ready)
        settings.error =
          'Карта загружается слишком долго. Проверьте соединение и перезагрузите страницу.';
    }, 20000);
  } catch (error) {
    settings.error = error instanceof Error ? error.message : 'Не удалось создать карту.';
  }
});
onBeforeUnmount(() => {
  disposed = true;
  abort.abort();
  clearTimeout(timeout);
  document.removeEventListener('visibilitychange', visibility);
  map?.remove();
  layer?.onRemove();
  settings.ready = false;
});
function resetCamera() {
  map?.flyTo({ center: MAP_CENTER, zoom: MAP_ZOOM, pitch: MAP_PITCH, bearing: -20 });
}
</script>
<template>
  <section class="map-scene" aria-label="Интерактивная карта Москвы">
    <div ref="container" class="map-container"></div>
    <div class="map-caption">
      <span class="live-dot"></span> МОСКВА <span class="caption-divider">/</span> ЦЕНТР
      <small>Демонстрационная симуляция</small>
    </div>
    <button class="reset-camera" aria-label="Вернуть камеру в центр Москвы" @click="resetCamera">
      ⌖ <span>В центр</span>
    </button>
    <div v-if="!settings.ready && !settings.error" class="map-message" role="status">
      Загрузка карты и 3D-сцены…
    </div>
    <div v-if="settings.error" class="map-message error" role="alert">
      <strong>Сцена недоступна</strong>
      <p>{{ settings.error }}</p>
      <button
        @click="
          settings.error = '';
          settings.ready = false;
          $router.go(0);
        "
      >
        Перезагрузить
      </button>
    </div>
    <div v-if="settings.warning" class="map-warning" role="status">
      {{ settings.warning
      }}<button aria-label="Закрыть уведомление" @click="settings.warning = ''">×</button>
    </div>
    <div class="map-legend">
      <span><i class="low"></i>Свободно</span><span><i class="medium"></i>Плотно</span
      ><span><i class="high"></i>Нагрузка</span>
    </div>
  </section>
</template>
