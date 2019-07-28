<template>
  <v-tabs
    v-model="activeTab"
    align-with-title
    color="#212121"
    :mandatory="false"
    right
  >
    <v-tabs-slider v-show="showSlider" color="#82B1FF"></v-tabs-slider>
    <v-tab
      key="Home"
      style="visibility: hidden;"
      to="/"
    />
    <v-tab
      v-for="tab in tabs"
      :key="tab.name"
      :href="tab.path"
      :to="tab"
      exact
      ripple
    >
      {{ tab.name }}
    </v-tab>
  </v-tabs>
</template>

<script>
  import { routes as tabs } from '@/pages';

  const activeTab = tabs.find((tab) => window.location.pathname.includes(tab.href || tab.path));  

  export default {
    // color="#f5f5f5" = light tabs
    data() {
      return {
        activeTab: activeTab && activeTab.name || 'Home',
        tabs: tabs.filter((tab) => tab.name !== 'Home'),
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

</style>
