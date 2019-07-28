// import Vue from 'vue';
// import * as Vue from 'vue/dist/vue.js';

import VueRouter from 'vue-router';

import Article from '../components/Article';

import About from './About';
import AboutB from './AboutB.md';
import Home from './Home';

function createMarkdownArticle(md) {
    return {
        components: { Article },
        template: '<Article :meta="meta" :title="title" :rawHtml="rawHtml"></Article>',
        data() {
            const meta = md.attributes || {};
            return {
                meta,
                title: meta.title || '',
                rawHtml: md.html
            };
        },
    };
}

export const routes = [
    { path: '/', exact: true, component: Home, icon: 'dashboard', name: 'Home' },
    { path: '/about', exact: true, component: About, icon: 'question_answer', name: 'About' },
    { path: '/aboutB', exact: true, component: createMarkdownArticle(AboutB), icon: 'question_answer', name: 'AboutB' },
    { path: '*', redirect: '/' },
];

const router = new VueRouter({
    routes,
    mode: 'history',
});

export default router;
