<template>
  <v-toolbar dense>
    <router-link class="toolbar-logo" to="/" exact>
      <img
        :src="require('../assets/mp_logo.svg')"
        height="32"
      />
    </router-link>
    <v-toolbar-title class="headline">
      <span class="title font-weight-light">MIRAJ PATEL</span>
    </v-toolbar-title>
    <v-tabs
        v-model="activeTab"
        align-with-title
        color="#212121"
        :mandatory="false"
        right
      >
        <v-tabs-slider v-show="showSlider" color="red"></v-tabs-slider>
        <v-tab
          key="Home"
          style="visibility: hidden;"
          to="/"
        />
        <v-tab
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab"
          exact
          ripple
        >
          {{ tab.name }}
        </v-tab>
    </v-tabs>
  </v-toolbar>
</template>

<script>
  const tabs = [
    { name: 'About', href: '/about' },
    // { name: 'Blog', href: '/blog' },
    // { name: 'Experiences', href: '/experiences' },
    // { name: 'Contact', href: '/contact' },
  ];
  const activeTab = tabs.find((tab) => window.location.pathname.includes(tab.href));
    
  export default {
    // color="#f5f5f5" = light tabs
    data() {
      return {
        tabs,
        activeTab: activeTab && activeTab.name || 'Home',
      }
    },
    computed: {
      showSlider: function() {
        return this.activeTab !== 'Home' && this.activeTab !== '/';
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
