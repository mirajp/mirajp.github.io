import VueRouter from 'vue-router';

import About from './About';
import Experiences from './Experiences';
import Home from './Home';

export const routes = [
  { path: '/', exact: true, component: Home, icon: 'home', name: 'Home' },
  { path: '/about', exact: true, component: About, icon: 'question_answer', name: 'About' },
  { path: '/experiences', exact: true, component: Experiences, icon: 'psychology', name: 'Experiences' },
  { path: '*', redirect: '/' },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

export default router;
