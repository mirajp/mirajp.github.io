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
    <mq-layout mq="mobile">
      <v-toolbar-side-icon @click.stop="$emit('set-drawer', true)"/>
    </mq-layout>
    <mq-layout mq="tablet+">
      <NavTabs/>
    </mq-layout>
  </v-toolbar>
</template>

<script>
import NavTabs from "./NavTabs";

export default {
    components: {
        NavTabs
    }
};
</script>

<style>
.title {
    font-size: 90% !important;
}

.title,
.v-toolbar .v-toolbar__title {
    width: stretch;
}

.toolbar-logo {
    display: grid;
    vertical-align: middle;
}

.toolbar-logo img {
    /* White */
    filter: invert(99%) sepia(6%) saturate(327%) hue-rotate(196deg)
        brightness(114%) contrast(100%);
}

@media (min-width: 48rem) {
    nav.v-toolbar {
        font-size: calc(1rem + ((1vw - 0.55rem))) !important;
    }
}

@media (min-width: 64rem) {
    nav.v-toolbar {
        font-size: calc(1rem + ((1vw - 0.75rem))) !important;
    }
}
</style>
