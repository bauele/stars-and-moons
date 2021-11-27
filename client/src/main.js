import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router';
import App from './App.vue'
import {BootstrapVue} from 'bootstrap-vue'
import VueClipboard from 'vue-clipboard2'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import './custom.scss'

import { GameInstance } from './store/game-instance.js';
import router from "./router.js";

Vue.use(BootstrapVue);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueClipboard)

Vue.config.productionTip = false

const store = new Vuex.Store({
  modules: {
    GameInstance
  }
})

console.log(router);

new Vue({
  render: h => h(App),
  store,
  router
}).$mount('#app')

Vue.config.productionTip = false