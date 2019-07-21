<template>
  <v-navigation-drawer v-model="drawer" app right temporary>
    <v-list class="pa-1">
      <v-list-tile avatar>
        <v-list-tile-avatar>
          <img src="https://avatars3.githubusercontent.com/u/6332917?s=400&v=4">
        </v-list-tile-avatar>

        <v-list-tile-content>
          <v-list-tile-title>Miraj Patel</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>

    <v-list class="pt-0" dense>
      <v-divider></v-divider>

      <v-list-tile
        v-for="item in items"
        :key="item.title"
        @click="onClick(item)"
      >
        <v-list-tile-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>{{ item.name }}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
  import { routes as items } from '../pages';
  
  export default {
    props: ['isVisible'],
    data() {
      return {
        drawer: this.isVisible,
        items: items.filter((item) => !!item.name),
      }
    },
    methods: {
      onClick(item) {
        this.$router.push(item.href || item.path);
      },
    },
    watch: {
      drawer(newVal) {
        if (this.isVisible !== this.drawer) {
          this.$emit('set-drawer', newVal);
        }
      },
      isVisible(newVal) {
        this.drawer = newVal;
      }
    }
  }
</script>

<style>
.v-avatar {
  background-color: darkgray;
}
</style>
