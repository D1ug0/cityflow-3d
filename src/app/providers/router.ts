import { createRouter, createWebHashHistory } from 'vue-router';
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('@/pages/city-map/CityMapPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
