<template>
  <v-app dark class="app">
    <NavDrawer @set-drawer="setDrawer" :isVisible="drawer"/>
    <Header @set-drawer="setDrawer"/>
    <v-content fluid>
      <router-view></router-view>
    </v-content>
    <Footer/>
  </v-app>
</template>

<script>
import Footer from "./components/Footer";
import Header from "./components/Header";
import NavDrawer from "./components/NavDrawer";

export default {
    name: "App",
    components: {
        Footer,
        Header,
        NavDrawer
    },
    data() {
        return {
            drawer: false
        };
    },
    methods: {
        setDrawer(visibility) {
            this.drawer = visibility;
        }
    }
};
</script>

<style>
html {
    overflow: auto !important;
}

body {
    display: flex;
    flex-direction: column;
    /* font-size: 1.15rem; */
    font-size: 100%;
    min-height: 100vh;
}

.app {
    flex: 1;
}

@media only screen and (max-width: 768px) {
    .display-2 {
        font-size: 2.4rem !important;
    }

    .display-3 {
        font-size: 2.6rem !important;
    }

    .display-4 {
        font-size: 6rem !important;
    }
}

/*
@media only screen and (min-width: 1024px) {
    html {
        font-size: 16px;
    }
}

@media only screen and (min-width: 1360px) {
    html {
        font-size: 18px;
    }
}

@media only screen and (min-width: 1600px) {
    html {
        font-size: 20px;
    }
}

@media only screen and (min-width: 1900px) {
    html {
        font-size: 22px;
    }
}
*/

@media (min-width: 48rem) {
    :root {
        font-size: calc(1rem + ((1vw - 0.55rem)));
    }

    [class^="v-"] {
        font-size: 97%;
    }
}
</style>
