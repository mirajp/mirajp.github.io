import VueRouter from 'vue-router';

import Article from '../components/Article';

// import About from './About';
import AboutMd from './About.md';
import Experiences from './Experiences';
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
                rawHtml: md.html,
            };
        },
    };
}

export const routes = [
    { path: '/', exact: true, component: Home, icon: 'home', name: 'Home' },
    // { path: '/about', exact: true, component: About, icon: 'question_answer', name: 'About' },
    { path: '/about', exact: true, component: createMarkdownArticle(AboutMd), icon: 'assignment_ind', name: 'About' },
    { path: '/experiences', exact: true, component: Experiences, icon: 'psychology', name: 'Experiences' },
    { path: '*', redirect: '/' },
];

const router = new VueRouter({
    routes,
    mode: 'history',
});

export default router;
