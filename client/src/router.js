import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';
Vue.use(VueRouter);

const routes = [
    {
        path: "/:id",
        name: "App",
        component: App
    }
];

const router = new VueRouter({
    mode: 'history',
    routes
});

export default router;