<template>
  <v-toolbar dense>
    <a class="toolbar-logo" href="/">
      <img
        :src="require('../assets/mp_logo.svg')"
        height="32"
      />
    </a>
    <v-toolbar-title class="headline">
      <span class="title font-weight-light">MIRAJ PATEL</span>
    </v-toolbar-title>
    <v-tabs
        align-with-title
        color="#212121"
        :mandatory="false"
        right
        slider-color="blue"
      >
        <v-tab
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.href"
          ripple
        >
          {{ tab.name }}
        </v-tab>
    </v-tabs>
  </v-toolbar>
</template>

<script>
  export default {
    // color="#f5f5f5" = light tabs
    data() {
      return {
        activeTab: 'About',
        tabs: [
          { name: 'Home', href: '/' },
          { name: 'About', href: '/about' },
          { name: 'Blog', href: '/blog' },
          { name: 'Experiences', href: '/experiences' },
          { name: 'Contact', href: '/contact' },
        ]
      }
    },
    methods: {
      goHome: function() {
        this.$router.push('/');
      }
    }
  }
</script>

<style>
.title, .v-toolbar .v-toolbar__title  {
  width: stretch;
}

.toolbar-logo {
  display: grid;
  vertical-align: middle;
}

.toolbar-logo img {
  /* White */
  filter: invert(99%) sepia(6%) saturate(327%) hue-rotate(196deg) brightness(114%) contrast(100%);
}
</style>
