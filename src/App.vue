<template>
  <v-app dark class="app">
    <Header/>
    <v-content fluid>
      <router-view></router-view>
    </v-content>
    <Footer/>
  </v-app>
</template>

<script>
import Footer from './components/Footer';
import Header from './components/Header';

export default {
  name: 'App',
  components: {
    Footer,
    Header,
  },
  data () {
    return {
      //
    }
  }
}
</script>

<style>
.app {
  flex: 1;
}
</style>
