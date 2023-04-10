<template>
  <div style="height: 100%">
    <div class="background-img" />
    <v-container fluid class="centered-content">
      <v-layout text-xs-center wrap>
        <v-flex xs12 style="align-self: center">
          <p class="display-4 font-weight-bold ma-3">
            Hello, I'm Miraj Patel.
          </p>
          <vue-typed-js
            @preStringTyped="updateArticle()"
            :backDelay="1000"
            :backSpeed="50"
            :loop="true"
            :strings="titles"
          >
            <p class="display-2 ma-1">
              I'm {{ article }}
              <br />
              <span class="typing"></span>
            </p>
          </vue-typed-js>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
const vowels = ["a", "e", "i", "o", "u"];
export default {
  computed: {
    article() {
      if (this.i === -1) return "a";
      return (
        (vowels.includes(
          this.titles[this.i]
            .replace("(", "")
            .charAt(0)
            .toLowerCase() // Not totally accurate (should be syllable based)
        ) &&
          "an") ||
        "a"
      );
    }
  },
  data: () => ({
    i: -1,
    titles: [
      "(frontend) software engineer.",
      "CS education mentor.",
      "AI (ML/NLP) enthusiast.",
      "Windows fanboy.",
      "Native NYer (and 🍕 connoisseur)."
    ]
  }),
  methods: {
    updateArticle() {
      this.i = (this.i + 1) % this.titles.length;
    }
  }
};
</script>

<style>
div.background-img {
  /* background-image: url("https://i.imgur.com/AmWThvw.jpg"); */
  background-image: -webkit-image-set(
    /* desktop */ url("https://i.imgur.com/AmWThvw.jpg") 1x,
    url("https://i.imgur.com/kMuKTT7.png") 2x
  );
  background-image: image-set(
    /* desktop */ url("https://i.imgur.com/AmWThvw.jpg") 1x,
    url("https://i.imgur.com/kMuKTT7.png") 2x
  );
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100%;
  opacity: 0.75;
}

div.background-img > div.v-image__image.v-image__image--cover {
  background-position: center -10vh;
}

.centered-content,
.centered-content > div {
  height: 100%;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  width: 100%;
}

.job-title {
  font-family: monospace;
  text-decoration: underline;
}

.typed-element > p {
  width: 100%;
}

.typing {
  white-space: pre-wrap;
}
</style>
