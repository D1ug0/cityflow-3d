<div align="center">

# 🌆 CityFlow 3D

### Интерактивная 3D-симуляция городского движения

Визуализация движения тысяч автомобилей по улицам Москвы  
с использованием **MapLibre, Three.js, WebGL и GPU Instancing**.

<br>

![Vue](https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre-396CB2?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL_2-990000?style=for-the-badge&logo=webgl&logoColor=white)

<br>

<img src="./docs/demo.gif" width="900" alt="Демонстрация CityFlow 3D">

</div>

---

## О проекте

**CityFlow 3D** — интерактивное Vue-приложение для визуализации городского движения в реальном времени.

MapLibre отвечает за карту, камеру и взаимодействие с географическими данными, а Three.js используется для 3D-рендеринга автомобилей и визуальных эффектов.

Обе библиотеки работают внутри **одного canvas и общего WebGL 2 context**, благодаря чему 3D-сцена остаётся синхронизированной с картой при масштабировании, наклоне и вращении камеры.

Проект создан как эксперимент с производительным WebGL-рендерингом большого количества объектов и интеграцией 3D-графики в картографическое приложение.

---

## Возможности

<table>
<tr>
<td width="50%">

### 🚗 До 10 000 автомобилей

Симуляция поддерживает несколько уровней нагрузки:

`100 / 1 000 / 5 000 / 10 000`

Автомобили двигаются по маршрутам реальных улиц.

</td>

<td width="50%">

### ⚡ GPU Instancing

Все автомобили рендерятся через `THREE.InstancedMesh`.

Это позволяет отрисовывать большое количество одинаковых объектов значительно дешевле, чем отдельные Mesh.

</td>
</tr>

<tr>
<td width="50%">

### 🗺 MapLibre + Three.js

Three.js подключён как Custom Layer MapLibre и использует ту же матрицу камеры и тот же WebGL-контекст.

</td>

<td width="50%">

### ✂️ Frustum Culling

Перед отправкой объектов на GPU определяется, какие автомобили действительно находятся в поле зрения камеры.

</td>
</tr>

<tr>
<td width="50%">

### ✨ GLSL-эффекты

Используются собственные shader-эффекты:

- подсветка выбранного автомобиля;
- визуализация потока;
- анимированные эффекты сцены.

</td>

<td width="50%">

### 🌧 Динамические эффекты

Поддерживаются:

- дождь;
- день;
- закат;
- ночь;
- изменение освещения и яркости карты.

</td>
</tr>

<tr>
<td width="50%">

### 📊 Performance Metrics

В приложение встроена debug-панель:

- FPS;
- frame time;
- draw calls;
- triangles;
- visible instances;
- количество объектов;

</td>

<td width="50%">

### 🎛 Adaptive Quality

При падении FPS приложение автоматически снижает качество рендеринга, а после стабилизации производительности может повысить его обратно.

</td>
</tr>
</table>

---

## Как устроен рендеринг

```text
                Vue UI
                   │
                   │ настройки / события
                   ▼
                Pinia
                   │
                   ▼
          SceneController
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
 Vehicle Simulation      Visual Effects
       │
       ▼
  ThreeMapLayer
       │
       │ MapLibre Custom Layer
       ▼
┌──────────────────────────────────┐
│          MapLibre Render         │
│                                  │
│ Camera Matrix                    │
│ Map Transform                    │
│ WebGL 2 Context                  │
└──────────────┬───────────────────┘
               │
               ▼
          Three.js
               │
      InstancedMesh / GLSL
               │
               ▼
              GPU
```

MapLibre управляет камерой.

На каждом кадре Three.js получает матрицу карты и использует её для своей камеры.

Благодаря этому автомобили остаются привязанными к дорожной сети при:

- масштабировании;
- вращении;
- изменении наклона карты.

---

## GPU Instancing

Основная оптимизация проекта — использование `THREE.InstancedMesh`.

Без instancing каждый автомобиль представлял бы собой отдельный объект:

```text
Car Mesh
Car Mesh
Car Mesh
Car Mesh
...
10 000 раз
```

Это означало бы большое количество draw calls.

Вместо этого используется один общий:

```text
InstancedMesh
   │
   ├── matrix #1
   ├── matrix #2
   ├── matrix #3
   ├── ...
   └── matrix #10000
```

Геометрия и материал передаются на GPU один раз, а каждый автомобиль отличается собственной transformation matrix.

Это позволяет значительно уменьшить количество вызовов рендеринга.

---

## Frustum Culling

Даже если в симуляции участвуют 10 000 автомобилей, не все из них находятся перед камерой.

Перед рендерингом выполняется проверка:

```text
10 000 vehicles
       │
       ▼
Frustum Culling
       │
       ├── visible
       │
       └── invisible
              ↓
        не отправляются
        на отрисовку
```

В instance buffer записываются только видимые автомобили.

При этом объекты вне камеры продолжают участвовать в симуляции.

---

## Симуляция движения

Каждый автомобиль движется по маршруту, представленному в виде `LineString`.

Для определения позиции используются накопленные длины сегментов.

Упрощённо:

```text
Route
A ─────── B ─── C ───────── D

          ↑
       vehicle
```

Для каждого автомобиля хранится:

```text
route
speed
progress
position
direction
```

Скорость задаётся в км/ч и преобразуется в перемещение по маршруту относительно времени кадра.

Данные симуляции хранятся преимущественно в **TypedArray**, а не в реактивном состоянии Vue.

Это позволяет не обновлять тысячи реактивных объектов на каждом кадре.

---

## Выбор автомобиля

Автомобиль можно выбрать кликом на карте.

Для этого используется:

```text
Mouse click
    ↓
Raycaster
    ↓
InstancedMesh
    ↓
instanceId
    ↓
Vehicle ID
    ↓
Информация об автомобиле
```

После frustum culling сохраняется соответствие между `instanceId` и реальным автомобилем симуляции.

Выбранный автомобиль дополнительно выделяется GLSL-эффектом.

---

## Уровни качества

Приложение поддерживает:

```text
LOW
MEDIUM
HIGH
```

Preset влияет на:

- детализацию автомобилей;
- Device Pixel Ratio;
- количество частиц дождя;
- качество визуальных эффектов;
- используемую модель автомобиля.

При высоком качестве используется локальная GLTF-модель.

---

## Adaptive Quality

CityFlow может автоматически адаптировать качество под производительность устройства.

Логика примерно такая:

```text
FPS падает
   ↓
3 секунды низкого FPS
   ↓
снижение качества
   ↓
cooldown
   ↓
20 секунд стабильного FPS
   ↓
возможное повышение качества
```

Так приложение старается сохранить приемлемый frame budget даже на менее производительных устройствах.

---

## Стек

| Направление | Технологии |
|---|---|
| Frontend | Vue 3 |
| Language | TypeScript |
| Build | Vite |
| Map | MapLibre GL |
| 3D | Three.js |
| Graphics | WebGL 2 |
| Shaders | GLSL |
| State | Pinia |
| Routing | Vue Router |
| Tests | Vitest |
| Geo Data | GeoJSON / OpenStreetMap |

---

## Архитектура

Frontend организован по принципам Feature-Sliced Design:

```text
src/
├── app/
├── pages/
├── widgets/
├── features/
├── entities/
└── shared/
```

Основная зависимость слоёв:

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

3D-движок при этом максимально отделён от Vue.

```text
shared/lib/three
```

не зависит от:

```text
Vue
Pinia
Vehicle Entity
```

---

## Основные компоненты

```text
SceneController
```

Связывает карту, симуляцию автомобилей и визуальные эффекты.

```text
ThreeMapLayer
```

Отвечает за lifecycle Three.js внутри MapLibre Custom Layer.

```text
entities/vehicle
```

Содержит модель симуляции автомобилей и их 3D-представление.

```text
entities/route
```

Работает с маршрутами, координатами и интерполяцией.

```text
entities/traffic
```

Содержит визуальные эффекты дорожного движения.

---

## Карта и данные

Сцена построена на основе дорожной сети центра Москвы.

Маршруты формируются по данным OpenStreetMap.

Локально в проекте находятся:

```text
маршруты
здания
3D-модель автомобиля
```

Для самой картографической подложки используются растровые тайлы OpenStreetMap.

Если интернет недоступен, локальная симуляция, дороги и здания продолжают работать, но картографическая подложка и подписи улиц могут быть недоступны.

---

## Запуск

Для работы требуется:

```text
Node.js 22.12+
npm
```

Клонируйте проект:

```bash
git clone https://github.com/D1ug0/map-project.git
cd map-project
```

Установите зависимости:

```bash
npm ci
```

Запустите development server:

```bash
npm run dev
```

После этого откройте адрес Vite, обычно:

```text
http://127.0.0.1:5173
```

---

<details>
<summary><b>⚙️ Команды проекта</b></summary>

<br>

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

Tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Lint:

```bash
npm run lint
```

Полная проверка:

```bash
npm run check
```

Она последовательно запускает:

```text
ESLint
→ Vitest
→ TypeScript
→ Production Build
```

</details>

---

## Тестирование

Unit-тестами покрывается ключевая логика приложения:

```text
движение по маршрутам
перевод скорости
progress
GeoJSON validation
нагрузка до 10 000 автомобилей
adaptive quality
frame budget
DPR / LOD
culling
vehicle selection
освобождение WebGL-ресурсов
MapLibre Custom Layer lifecycle
```

WebGL renderer в интеграционных тестах мокируется, поэтому unit-тесты проверяют логику рендер-системы, но не заменяют визуальное тестирование настоящего GPU.

---

## Управление ресурсами

Особое внимание в проекте уделено освобождению WebGL-ресурсов.

При удалении сцены освобождаются:

```text
Geometry
Materials
Textures
InstancedMesh
Renderer resources
Event listeners
```

При изменении количества автомобилей старый `InstancedMesh` уничтожается перед созданием нового.

Three.js не вызывает `forceContextLoss()`, поскольку WebGL-контекст принадлежит MapLibre и используется совместно.

---

## Производительность

Основная задача проекта — исследование производительности рендеринга большого количества объектов.

Приложение позволяет тестировать:

| Vehicles | Использование |
|---:|---|
| 100 | базовая сцена |
| 1 000 | средняя нагрузка |
| 5 000 | высокая нагрузка |
| 10 000 | stress test |

Встроенная debug-панель позволяет отслеживать:

```text
Average FPS
Minimum FPS
Frame time
Draw calls
Triangles
Visible instances
DPR
Three.js resources
```

Реальные FPS зависят от устройства, GPU, браузера, DPR, количества объектов и включённых эффектов.

---

## Ограничения

CityFlow 3D — **визуальная симуляция**, а не полноценная модель дорожного движения или навигационная система.

На текущем этапе не моделируются:

```text
светофоры
полосы движения
столкновения
ограничения поворотов
реальная загруженность дорог
реальная скорость трафика
```

Автомобили визуализируют движение по дорожному графу, но не имитируют полноценную транспортную модель города.

---

## Что хотелось изучить в проекте

CityFlow 3D создавался как практический проект для работы с производительным WebGL-рендерингом.

Основные технические задачи:

```text
MapLibre + Three.js integration
GPU Instancing
GLSL shaders
WebGL resource management
Frustum Culling
Raycasting
Adaptive Quality
LOD
Frame Budget
3D rendering architecture
Performance optimization
```

---

## Дальнейшее развитие

Проект можно расширить:

```text
GPU Picking
GPU-based simulation
spatial index
screen-space post-processing
Bloom
real traffic API
traffic lights
lane simulation
advanced LOD
Web Workers
GPU Compute
```

---

<div align="center">

### CityFlow 3D

**MapLibre × Three.js × WebGL**

Интерактивная карта, 3D-графика и тысячи объектов в одном render loop.

</div>
