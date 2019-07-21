import VueRouter from 'vue-router';

import About from './About';
import Home from './Home';

export const routes = [
    { path: '/', exact: true, component: Home, icon: 'dashboard', name: 'Home' },
    { path: '/about', exact: true, component: About, icon: 'question_answer', name: 'About' },
    { path: '*', redirect: '/' },
];

const router = new VueRouter({
    routes,
    mode: 'history',
});

export default router;
