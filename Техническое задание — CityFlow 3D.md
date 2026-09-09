# Техническое задание: CityFlow 3D

## 1. Название проекта

**CityFlow 3D**

Интерактивное веб-приложение для визуализации городского трафика на карте с использованием Vue, MapLibre GL JS, Three.js, WebGL и GLSL.

---

# 2. Цель проекта

Разработать веб-приложение, демонстрирующее работу с:

- интерактивными картами;
- 3D-графикой;
- WebGL;
- пользовательскими GLSL-шейдерами;
- большим количеством объектов;
- оптимизацией GPU-рендеринга;
- адаптацией графики под настольные и мобильные устройства;
- архитектурой большого Vue-приложения.

Основная задача проекта — не просто показать красивую карту, а продемонстрировать понимание полного графического pipeline:

**Vue → MapLibre → Custom 3D Layer → Three.js → WebGL → GLSL → GPU**

---

# 3. Основной сценарий

Пользователь открывает приложение и видит интерактивную карту города.

На карте отображаются:

- дороги;
- здания;
- названия улиц;
- 3D-автомобили;
- интенсивность трафика;
- различные визуальные эффекты.

Автомобили движутся по заранее заданным маршрутам.

Пользователь может:

- перемещать карту;
- изменять zoom;
- вращать и наклонять карту;
- включать и отключать 3D-слои;
- выбирать отдельный автомобиль;
- переключать время суток;
- включать погодные эффекты;
- изменять качество графики;
- смотреть статистику производительности.

---

# 4. Технологический стек

## Frontend

- Vue 3;
- TypeScript;
- Composition API;
- Vite;
- Vue Router;
- Pinia.

## Карты

- MapLibre GL JS.

## 3D

- Three.js.

## Графический API

- WebGL 2.

## Шейдеры

- GLSL.

## Данные

- GeoJSON;
- JSON.

## Тестирование

- Vitest;

## Архитектура

- Feature-Sliced Design.

---

# 5. Основной интерфейс

Приложение состоит из четырёх основных областей.

```text
┌─────────────────────────────────────────────────────┐
│ CityFlow                              FPS: 60       │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│ СЛОИ          │                                     │
│               │                                     │
│ ☑ Traffic     │                                     │
│ ☑ Buildings   │             MAPLIBRE                │
│ ☐ Rain        │                 +                   │
│ ☐ Heatmap     │              THREE.JS               │
│               │                                     │
│ ВРЕМЯ         │                                     │
│ ━━━━━●━━━━    │                                     │
│               │                                     │
│ QUALITY       │                                     │
│ High          │                                     │
│               │                                     │
├───────────────┴─────────────────────────────────────┤
│ FPS 60 | Frame 14ms | Calls 14 | Triangles 120k    │
└─────────────────────────────────────────────────────┘
```

---

# 6. Карта

MapLibre является базовым графическим слоем приложения.

MapLibre отвечает за:

- карту;
- улицы;
- здания;
- подписи;
- управление камерой;
- zoom;
- pitch;
- bearing;
- преобразование географических координат;
- управление слоями карты.

При старте приложения карта должна открываться на заранее выбранной территории.

Например:

**Москва, центральная часть города.**

На первом этапе реальные онлайн-данные о трафике не требуются.

Допускается использование заранее подготовленных тестовых GeoJSON-данных.

---

# 7. 3D-слой

Поверх карты необходимо создать отдельный 3D-слой.

Он должен быть реализован через:

**MapLibre Custom Layer + Three.js.**

Three.js не должен существовать как отдельная независимая карта или отдельный пользовательский canvas поверх интерфейса.

MapLibre и Three.js должны использовать единую систему камеры и синхронизированный rendering pipeline.

3D-слой отвечает за:

- автомобили;
- специальные 3D-маркеры;
- эффекты;
- частицы;
- пользовательские материалы.

---

# 8. Автомобили

Основной демонстрационный объект проекта — автомобиль.

Необходимо использовать простую оптимизированную 3D-модель.

Предпочтительный формат:

**GLTF / GLB.**

Каждый автомобиль содержит:

```text
Vehicle

id
position
rotation
speed
route
progress
type
status
```

Например:

```text
Vehicle

id: car-483
speed: 42 km/h
route: route-12
progress: 0.48
status: moving
```

---

# 9. Движение автомобилей

Автомобили должны двигаться по заранее заданным маршрутам.

Маршрут представляет собой LineString.

```text
A
│
│
└───────────┐
            │
            │
            └──────── B
```

Для каждого автомобиля хранится значение:

```text
0 ---------------------------- 1

              ●
            0.48
```

Где:

- `0` — начало маршрута;
- `1` — конец маршрута.

На каждом кадре позиция автомобиля пересчитывается согласно скорости и текущему progress.

---

# 10. Массовая отрисовка автомобилей

Приложение должно поддерживать несколько режимов нагрузки:

- 100 автомобилей;
- 1 000 автомобилей;
- 5 000 автомобилей;
- 10 000 автомобилей.

Для большого количества одинаковых объектов необходимо использовать GPU Instancing.

Например:

```text
НЕ:

Mesh
Mesh
Mesh
Mesh
Mesh
...
5000 раз


А:

InstancedMesh

 ├ vehicle
 ├ vehicle
 ├ vehicle
 ├ vehicle
 └ vehicle
```

Цель — уменьшить количество draw calls.

---

# 11. Выбор автомобиля

Пользователь должен иметь возможность нажать на автомобиль.

После выбора появляется информационная панель.

Например:

```text
Vehicle #124

Speed
48 km/h

Route
Tverskaya → Arbat

Status
Moving
```

Выбранный автомобиль визуально выделяется.

Для выделения необходимо использовать пользовательский shader.

---

# 12. GLSL Shader №1 — Selection / Glow

Необходимо реализовать собственный GLSL-материал для выбранного объекта.

Выбранный автомобиль должен получать визуальный эффект:

- glow;
- pulsation;
- outline;
- либо комбинацию эффектов.

Shader должен использовать как минимум:

- vertex shader;
- fragment shader;
- uniform-параметры.

Например:

```text
uTime
uColor
uIntensity
```

`uTime` должен позволять анимировать материал на GPU.

---

# 13. GLSL Shader №2 — Traffic Flow

Необходимо реализовать визуализацию потока движения.

На дороге должен отображаться анимированный поток:

```text
━━━━━━━━━━━━━━━━━━

━━━▓▓━━━━━━━━━━━━━

━━━━━━▓▓━━━━━━━━━━

━━━━━━━━━▓▓━━━━━━━
```

Эффект должен двигаться средствами shader, а не путём постоянного изменения DOM или создания большого количества JS-объектов.

Цвет/интенсивность участка может зависеть от уровня трафика.

Например:

```text
low
↓
зелёный

medium
↓
жёлтый

high
↓
красный
```

---

# 14. Дополнительный GLSL-эффект

В расширенной версии проекта реализовать ещё один GPU-эффект.

Варианты:

- heatmap;
- вода;
- волна;
- procedural noise;
- fog;
- animated grid.

Это необязательная часть MVP, но желательная для итогового портфолио.

---

# 15. Погодные эффекты

Добавить режим:

**Rain**

На карте появляются частицы дождя.

Дождь реализуется через:

- Points;
- BufferGeometry;
- собственный shader.

Не допускается создание отдельного Mesh для каждой капли.

Количество частиц зависит от выбранного качества графики.

---

# 16. Время суток

Добавить переключатель времени.

Например:

```text
06:00 ───────────── 12:00 ───────────── 18:00 ───────────── 00:00
```

Минимально необходимо поддержать:

- Day;
- Sunset;
- Night.

Изменение времени влияет на:

- освещение Three.js;
- внешний вид 3D-объектов;
- параметры shader;
- при возможности — стиль базовой карты.

---

# 17. Performance Panel

В режиме разработки пользователь должен иметь возможность открыть панель производительности.

Она показывает:

```text
FPS

Frame time

Draw calls

Triangles

Textures

Geometries

Vehicle count

Pixel ratio
```

Пример:

```text
PERFORMANCE

FPS             60

Frame           14.2 ms

Draw calls      18

Triangles       184 320

Textures        12

Geometries      7

Vehicles        5 000

DPR             1.5
```

---

# 18. Frame Budget

Приложение должно учитывать бюджет кадра.

Для 60 FPS:

```text
≈ 16.7 ms
```

Для 30 FPS:

```text
≈ 33.3 ms
```

Performance Monitor должен вычислять среднее время рендера кадра.

Дополнительно желательно рассчитывать:

- average FPS;
- min FPS;
- frame time;
- rolling average за последние N кадров.

---

# 19. Настройки качества

Добавить три режима:

```text
LOW

MEDIUM

HIGH
```

## HIGH

- высокий DPR;
- максимальное количество частиц;
- максимальный LOD;
- визуальные эффекты включены.

## MEDIUM

- ограниченный DPR;
- уменьшенное количество частиц;
- средний LOD;
- часть тяжёлых эффектов отключена.

## LOW

- DPR около 1;
- минимальное количество частиц;
- упрощённые модели;
- минимальные эффекты;
- отсутствие тяжёлой постобработки.

---

# 20. Adaptive Quality

Реализовать автоматическое снижение качества.

Например:

```text
High

FPS < 45

↓

Medium

FPS < 30

↓

Low
```

Обратное повышение должно происходить медленнее, чтобы система не переключала качество постоянно между двумя режимами.

То есть необходим hysteresis/cooldown.

Пример:

```text
60 FPS
High

↓

38 FPS в течение нескольких секунд

↓

Medium

↓

55 FPS

не переключаем сразу

↓

стабильные 55+ FPS некоторое время

↓

High
```

---

# 21. LOD

Для сложных 3D-объектов предусмотреть несколько уровней детализации.

Например:

```text
0–50 м
High

50–200 м
Medium

200+ м
Low
```

Для автомобилей допустимо иметь:

```text
High model

↓

Simplified model

↓

Primitive / very low poly
```

---

# 22. Culling

Необходимо использовать отсечение невидимых объектов.

Объекты вне области камеры не должны создавать лишнюю GPU-нагрузку.

Минимально:

- frustum culling.

В расширенной версии можно реализовать собственную пространственную индексацию или дополнительный geographical culling.

---

# 23. Управление ресурсами

Все GPU-ресурсы должны иметь понятный lifecycle.

При удалении слоя необходимо освобождать:

- geometry;
- material;
- texture;
- render target;
- event listeners.

Не должно оставаться неиспользуемых WebGL-ресурсов после повторного включения/выключения слоя.

---

# 24. Архитектура приложения

Использовать Feature-Sliced Design.

Основные слои:

```text
app
pages
widgets
features
entities
shared
```

Направление зависимостей:

```text
app
 ↓
pages
 ↓
widgets
 ↓
features
 ↓
entities
 ↓
shared
```

Нижние слои не должны импортировать код из верхних.

---

# 25. Предлагаемая структура

```text
src/

├── app/
│   ├── providers/
│   │   ├── router/
│   │   └── store/
│   │
│   ├── styles/
│   └── App.vue
│
├── pages/
│   └── city-map/
│       ├── ui/
│       │   └── CityMapPage.vue
│       └── index.ts
│
├── widgets/
│   │
│   ├── map-scene/
│   │   ├── ui/
│   │   │   └── MapScene.vue
│   │   ├── model/
│   │   └── index.ts
│   │
│   ├── layer-panel/
│   │   └── ui/
│   │       └── LayerPanel.vue
│   │
│   ├── performance-panel/
│   │   └── ui/
│   │       └── PerformancePanel.vue
│   │
│   └── vehicle-details/
│       └── ui/
│           └── VehicleDetails.vue
│
├── features/
│   │
│   ├── select-vehicle/
│   │   ├── model/
│   │   ├── ui/
│   │   └── index.ts
│   │
│   ├── toggle-map-layer/
│   │   ├── model/
│   │   └── ui/
│   │
│   ├── change-graphics-quality/
│   │   ├── model/
│   │   └── ui/
│   │
│   ├── change-time-of-day/
│   │   ├── model/
│   │   └── ui/
│   │
│   └── toggle-weather/
│       ├── model/
│       └── ui/
│
├── entities/
│   │
│   ├── vehicle/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── store.ts
│   │   │
│   │   ├── lib/
│   │   │   └── vehicle-animation.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── route/
│   │   ├── model/
│   │   ├── lib/
│   │   └── index.ts
│   │
│   └── traffic/
│       ├── model/
│       └── index.ts
│
└── shared/
    │
    ├── ui/
    │   ├── button/
    │   ├── switch/
    │   ├── slider/
    │   └── panel/
    │
    ├── api/
    │   ├── vehicles/
    │   └── routes/
    │
    ├── config/
    │   ├── map.ts
    │   └── graphics.ts
    │
    ├── types/
    │
    └── lib/
        │
        ├── maplibre/
        │   ├── create-map.ts
        │   ├── coordinates.ts
        │   └── map-events.ts
        │
        ├── three/
        │   │
        │   ├── core/
        │   │   ├── ThreeScene.ts
        │   │   ├── ThreeRenderer.ts
        │   │   └── ResourceManager.ts
        │   │
        │   ├── map-layer/
        │   │   ├── ThreeMapLayer.ts
        │   │   └── MapCameraAdapter.ts
        │   │
        │   ├── shaders/
        │   │   ├── glow/
        │   │   ├── traffic/
        │   │   └── rain/
        │   │
        │   └── utils/
        │
        └── performance/
            ├── PerformanceMonitor.ts
            ├── QualityManager.ts
            └── FrameBudget.ts
```

---

# 26. Почему Three.js находится в shared

Важно архитектурно разделить:

```text
Three.js engine

и

конкретные объекты приложения
```

`shared/lib/three` не должен знать ничего про автомобили.

Он знает только:

```text
Scene
Renderer
Camera
WebGL
Shaders
Resources
MapLibre integration
```

Например:

```text
shared/lib/three

не знает:

Vehicle
Traffic
Route
```

Это техническая инфраструктура.

---

# 27. Entity Vehicle

Всё, что связано непосредственно с понятием автомобиля, находится в:

```text
entities/vehicle
```

Например:

```text
Vehicle
VehicleId
VehiclePosition
VehicleStatus
VehicleSpeed
```

При этом низкоуровневый renderer не должен зависеть от Vue.

Правильнее:

```text
Vue

↓

Vehicle Entity

↓

3D adapter

↓

Three Engine
```

---

# 28. Главный принцип архитектуры

Необходимо избегать ситуации:

```text
MapScene.vue

3000 строк

Three.js
MapLibre
Shaders
API
Pinia
UI
Animations
Performance
```

Vue-компоненты должны управлять пользовательским интерфейсом.

Графический код должен находиться вне Vue-компонентов.

Например:

```text
MapScene.vue
      │
      ↓
ThreeMapLayer
      │
      ↓
ThreeScene
      │
 ┌────┼────┐
 ↓    ↓    ↓
Cars Rain Traffic
```

---

# 29. ThreeMapLayer

Ключевой архитектурный класс проекта:

```text
ThreeMapLayer
```

Его задача:

- подключиться к MapLibre;
- получить WebGL context;
- создать Three.js renderer;
- создать сцену;
- синхронизировать Three camera с MapLibre camera;
- вызвать render Three.js;
- очистить ресурсы при уничтожении.

Условный lifecycle:

```text
MapLibre

↓

addLayer()

↓

ThreeMapLayer.onAdd()

↓

create Three scene

↓

render()

↓

render()

↓

render()

↓

onRemove()

↓

dispose resources
```

---

# 30. ResourceManager

Создать отдельный менеджер ресурсов.

Он отвечает за:

- загрузку GLTF;
- textures;
- geometry;
- materials;
- переиспользование ресурсов;
- dispose.

Например одна модель автомобиля не должна загружаться 5000 раз.

```text
car.glb

↓ LOAD ONCE

VehicleGeometry

↓

InstancedMesh × 5000
```

---

# 31. PerformanceMonitor

Создать отдельный сервис:

```text
PerformanceMonitor
```

Он не зависит от Vue.

Он собирает:

- FPS;
- frame time;
- draw calls;
- triangles;
- textures;
- geometries.

Vue `PerformancePanel` только отображает эти данные.

Архитектура:

```text
WebGLRenderer

↓

PerformanceMonitor

↓

Pinia / reactive adapter

↓

PerformancePanel.vue
```

---

# 32. QualityManager

Отдельный сервис:

```text
QualityManager
```

Хранит:

```text
LOW
MEDIUM
HIGH
```

и определяет параметры рендера.

Например:

```text
HIGH

DPR: 2
Rain: 10 000
LOD: High
Effects: all
```

```text
MEDIUM

DPR: 1.5
Rain: 5 000
LOD: Medium
```

```text
LOW

DPR: 1
Rain: 1 000
LOD: Low
Effects: minimal
```

---

# 33. Состояние приложения

Не следует хранить каждый кадр анимации автомобилей в Pinia/Vue.

Например плохой вариант:

```text
requestAnimationFrame

↓

5000 vehicles

↓

обновляем Pinia 60 раз в секунду

↓

Vue reactivity
```

Состояние высокочастотной графики должно находиться внутри 3D-engine.

Vue/Pinia хранит только состояние уровня приложения:

```text
selectedVehicleId

activeLayers

graphicsQuality

weatherMode

timeOfDay

debugEnabled
```

---

# 34. Render Loop

В приложении должен существовать единый понятный механизм рендера.

Не допускается создание большого количества независимых:

```text
requestAnimationFrame()
```

для разных объектов.

Должен быть один контролируемый rendering pipeline.

Условно:

```text
MapLibre render

↓

ThreeMapLayer

↓

update simulation

↓

update uniforms

↓

update instances

↓

render Three scene

↓

collect performance metrics
```

---

# 35. Работа с памятью

При уничтожении сцены обязательно освобождать GPU-ресурсы.

Особое внимание:

- textures;
- BufferGeometry;
- Material;
- RenderTarget;
- GLTF resources.

Необходимо проверить отсутствие постоянного роста памяти при:

```text
Traffic OFF
Traffic ON
Traffic OFF
Traffic ON
Traffic OFF
Traffic ON
```

---

# 36. Обработка ошибок

Необходимо предусмотреть:

- отсутствие WebGL;
- WebGL context lost;
- ошибку загрузки модели;
- ошибку загрузки карты;
- неправильные GeoJSON-данные;
- невозможность загрузить texture.

Пользователь должен увидеть понятное сообщение вместо пустого экрана.

---

# 37. Mobile

Приложение должно быть адаптивным.

На мобильном устройстве:

```text
карта
↓
основная область

панели
↓
bottom sheet / collapsible panel
```

Необходимо учитывать:

- меньшую GPU-мощность;
- ограниченную память;
- высокий devicePixelRatio;
- touch input.

На mobile по умолчанию допускается использование `MEDIUM` или `LOW` quality preset.

---

# 38. Производительность

Не требуется гарантировать одинаковый FPS абсолютно на всех устройствах.

Производительность оценивается на заранее зафиксированных тестовых устройствах или классах устройств.

Целевые значения:

## Desktop

При стандартной сцене:

```text
5 000 автомобилей
+
карта
+
traffic shader
```

целевой показатель:

```text
≈ 60 FPS
```

на современном desktop GPU.

## Mobile

При:

```text
1 000–2 000 автомобилей
+
MEDIUM quality
```

целевой показатель:

```text
не ниже ≈ 30 FPS
```

на выбранном тестовом мобильном устройстве.

---

# 39. Нагрузочный режим

Добавить developer-настройку:

```text
Vehicle count

100

1 000

5 000

10 000
```

Это позволит визуально продемонстрировать влияние количества объектов на производительность.

Особенно полезно сравнить:

```text
Mesh × N

vs

InstancedMesh
```

---

# 40. Debug Mode

Добавить параметр:

```text
?debug=true
```

или отдельный переключатель.

В debug-режиме показывать:

- FPS;
- frame time;
- draw calls;
- triangles;
- количество объектов;
- текущий quality level;
- DPR.

---

# 41. Тестирование

## Unit tests

Проверить:

- вычисление позиции автомобиля на маршруте;
- QualityManager;
- FrameBudget;
- преобразование данных;
- выбор LOD;
- работу configuration.

## Integration tests

Проверить:

- создание карты;
- подключение ThreeMapLayer;
- включение/выключение слоя;
- корректный cleanup.

## E2E

Проверить пользовательские сценарии:

```text
открыть приложение

↓

карта появилась

↓

включить Traffic

↓

выбрать автомобиль

↓

появилась карточка

↓

включить Rain

↓

сменить Quality
```

---

# 42. README

Проект должен содержать подробный README.

README должен объяснять:

## Что представляет собой проект

Короткое описание CityFlow.

## Stack

```text
Vue 3
TypeScript
MapLibre
Three.js
WebGL
GLSL
Pinia
FSD
```

## Architecture

Схема:

```text
Vue / FSD

↓

MapLibre

↓

Custom Layer

↓

Three.js

↓

WebGL

↓

GPU
```

## Rendering

Объяснить работу rendering pipeline.

## Performance

Описать:

- почему используется InstancedMesh;
- что такое draw calls;
- как используется LOD;
- как работает adaptive quality;
- какие показатели были до оптимизации;
- какие стали после.

---

# 43. Очень желательный раздел README

Добавить:

# Performance Case Study

Например:

```text
Initial implementation

5 000 individual Mesh objects

FPS: 18
Draw calls: 5 100
```

После оптимизации:

```text
Instanced rendering

FPS: 60
Draw calls: 20
```

Необходимо использовать реальные полученные в проекте значения, а не выдуманные цифры.

Это одна из самых важных частей проекта для демонстрации работодателю.

---

# 44. Этапы разработки

## Этап 1 — базовый Vue-проект

Настроить:

- Vue;
- TypeScript;
- Vite;
- FSD;
- ESLint;
- Prettier;
- Vitest.

---

## Этап 2 — MapLibre

Реализовать:

- карту;
- zoom;
- pitch;
- rotate;
- базовые controls.

Результат:

```text
Vue + MapLibre
```

---

## Этап 3 — Custom 3D Layer

Создать:

```text
ThreeMapLayer
```

Вывести самый простой Three.js объект.

Например:

```text
Cube
```

Результат:

```text
MapLibre

+

Three.js object
```

---

## Этап 4 — загрузка 3D-модели

Добавить GLTF/GLB автомобиль.

Правильно позиционировать его на географической карте.

---

## Этап 5 — движение

Добавить Route.

Реализовать движение автомобиля по маршруту.

---

## Этап 6 — несколько автомобилей

Добавить:

```text
100 автомобилей
```

---

## Этап 7 — Instancing

Перевести автомобили на:

```text
InstancedMesh
```

Проверить изменение draw calls.

---

## Этап 8 — GLSL

Реализовать:

1. Glow shader.
2. Traffic Flow shader.

---

## Этап 9 — Performance

Добавить:

```text
PerformanceMonitor
```

Показывать:

- FPS;
- draw calls;
- triangles;
- frame time.

---

## Этап 10 — нагрузка

Проверить:

```text
100

1 000

5 000

10 000
```

автомобилей.

---

## Этап 11 — оптимизация

Добавить:

- LOD;
- culling;
- resource reuse;
- adaptive DPR;
- quality presets.

---

## Этап 12 — дополнительные эффекты

Добавить:

- Rain;
- Night;
- дополнительный GLSL effect.

---

## Этап 13 — Mobile

Оптимизировать UI и rendering для мобильных устройств.

---

## Этап 14 — Performance Case Study

Провести профилирование.

Зафиксировать:

```text
до

↓

изменение

↓

после
```

---

# 45. MVP

Чтобы проект не превратился в бесконечную разработку, минимальной законченной версией считать:

- Vue 3 + TypeScript;
- FSD;
- MapLibre;
- Three.js Custom Layer;
- 3D-модель автомобиля;
- движение по маршруту;
- минимум 1 000 автомобилей;
- InstancedMesh;
- выбор автомобиля;
- один собственный GLSL shader;
- Performance Panel;
- LOW/MEDIUM/HIGH presets;
- базовая mobile-адаптация.

После этого проект уже можно демонстрировать.

---

# 46. Версия Portfolio

После MVP добавить:

- 5 000–10 000 автомобилей;
- второй GLSL shader;
- LOD;
- Rain particles;
- Day/Night;
- adaptive quality;
- дополнительные GPU-оптимизации;
- полноценный Performance Case Study.

---

# 47. Критерии готовности

Проект считается завершённым, если:

1. Карта стабильно отображается.

2. Three.js интегрирован как 3D-слой MapLibre.

3. 3D-объекты корректно двигаются вместе с картой.

4. Автомобили могут двигаться по маршрутам.

5. Для большого количества автомобилей используется instancing.

6. Есть минимум два пользовательских GLSL shader'а в Portfolio-версии.

7. Реализована система качества графики.

8. Есть Performance Panel.

9. Можно сравнить нагрузку при разных количествах объектов.

10. Ресурсы корректно освобождаются.

11. Интерфейс работает на desktop и mobile.

12. Архитектура разделяет Vue UI и graphics engine.

13. README объясняет архитектуру.

14. README содержит реальные результаты профилирования и оптимизации.

---

# 48. Что проект должен показать работодателю

После завершения проекта разработчик должен уметь открыть репозиторий и последовательно показать:

```text
Вот Vue-приложение.

↓

Вот FSD.

↓

Вот MapLibre.

↓

Вот CustomLayer.

↓

Вот интеграция Three.js.

↓

Вот lifecycle 3D-слоя.

↓

Вот GLSL shaders.

↓

Вот InstancedMesh.

↓

Вот performance metrics.

↓

Вот проблема с FPS.

↓

Вот профилирование.

↓

Вот оптимизация.

↓

Вот результат после оптимизации.
```

Именно это является основной целью проекта.

Проект должен демонстрировать не только способность получить красивую 3D-картинку, но и понимание того, **как устроен realtime rendering, где возникают проблемы производительности и как строить поддерживаемую архитектуру приложения с отдельным 3D-графическим слоем**.
