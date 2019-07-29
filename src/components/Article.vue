<template>
  <v-container>
    <v-layout justify-center wrap>
      <v-flex text-xs-center mb-3>
        <div class="display-2 font-weight-bold">
          {{ title }}
        </div>
      </v-flex>

      <v-flex mb-3 xs12>
        <v-layout wrap>
          <div v-html="rawHtml" />
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    props: ['meta', 'title', 'rawHtml'],
  }
</script>

<style>

</style>
