// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ["@vueuse/nuxt"],
  app: {
    head: {
      title: "Easy tracker",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
});
