<template>
  <v-footer height="" class="footer">
    <div class="social-icons">
      <v-btn
        v-for="social in socials"
        :key="social.link"
        :href="social.link"
        class="mx-1 social-icon white--text"
        icon
      >
        <v-icon>{{ social.icon }}</v-icon>
      </v-btn>
    </div>
    <div class="copyright">
      &copy; Miraj Patel {{ new Date().getFullYear() }}
    </div>
  </v-footer>
</template>

<script>
export default {
    data: () => ({
        socials: [
            {
                icon: "fab fa-linkedin",
                link: "https://www.linkedin.com/in/mirajp/"
            },
            { icon: "fab fa-github", link: "https://www.github.com/mirajp/" },
        ]
    })
};
</script>

<style>
.copyright {
    right: 0px;
    padding-right: 1rem;
}

.footer {
    font-size: 120%;
}

.footer .v-btn--icon {
    margin-top: 0px;
    margin-bottom: 0px;
}

.footer div {
    position: absolute;
}

.pull-left {
    left: 0px;
    padding-left: 1rem;
}

.social-icon {
    margin-left: 0.5vw !important;
    margin-right: 0.5vw !important;
}

.social-icons {
    left: 0%;
    right: 0%;
    text-align: center;
}

div.social-icons > *.social-icon > div > svg {
    font-size: 120%;
}

@media (min-width: 48rem) {
    footer.footer {
        font-size: calc(1rem + ((1vw - 0.75rem)));
        height: calc(1rem + ((1vw - 0.15rem)) * 1.5);
    }

    div.social-icons > *.social-icon > div > svg {
        font-size: calc(1rem + ((1vw - 0.65rem)));
    }
}

@media only screen and (max-width: 768px) {
    .social-icons {
        text-align: initial;
    }
}
</style>
