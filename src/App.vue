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
import Footer from './components/Footer';
import Header from './components/Header';
import NavDrawer from './components/NavDrawer';

export default {
  name: 'App',
  components: {
    Footer,
    Header,
    NavDrawer,
  },
  data () {
    return {
      drawer: false,
    }
  },
  methods: {
    setDrawer(visibility) {
      this.drawer = visibility;
    }
  },
}
</script>

<style>
html {
  overflow: auto !important;
}

body {
  display: flex;
  flex-direction: column;
  font-size: 1.15rem;
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

</style>
