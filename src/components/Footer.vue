<template>
  <v-footer class="footer">
    <div class="pull-center">
      <v-btn
        v-for="social in socials"
        :key="social"
        :href="social.link"
        class="mx-3 white--text"
        icon
      >
        <v-icon size="24px">{{ social.icon }}</v-icon>
      </v-btn>
    </div>
    <div class="pull-right">
      &copy; Miraj Patel {{ new Date().getFullYear() }}
    </div>
  </v-footer>
</template>

<script>
  export default {
    data: () => ({
      socials: [
        { icon: 'fab fa-linkedin', link: 'https://www.linkedin.com/in/mirajp/' },
        { icon: 'fab fa-github', link: 'https://www.github.com/mirajp/' },
        { icon: 'fas fa-paperclip', link: 'https://github.com/mirajp/mirajp.github.io/blob/master/PatelMiraj_Resume.pdf' },
      ],
    }),
  }
</script>

<style>
.footer .v-btn--icon {
  margin-top: 0px;
  margin-bottom: 0px;
}

.footer div {
  /* display: inline-block; */
  position: absolute;
}

.pull-left {
  left: 0px;
  padding-left: 1rem;
}

.pull-center {
  left: 0%;
  right: 0%;
  text-align: center;
}

.pull-right {
  right: 0px;
  padding-right: 1rem;
}
</style>
