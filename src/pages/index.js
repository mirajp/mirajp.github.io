import VueRouter from 'vue-router';

import About from './About';
import Home from './Home';

const routes = [
    { path: '/', exact: true, component: Home },
    { path: '/about', exact: true, component: About },
    { path: '*', redirect: '/' },
];

const router = new VueRouter({
    routes,
    mode: 'history',
});

export default router;
