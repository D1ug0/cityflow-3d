import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './providers/router';
import App from './App.vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/main.css';
createApp(App).use(createPinia()).use(router).mount('#app');
