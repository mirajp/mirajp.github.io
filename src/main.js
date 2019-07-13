import Vue from 'vue';

import './plugins/router';
import './plugins/vuetify';

import router from './pages';
import App from './App.vue';

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
