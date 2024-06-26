// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ["@vueuse/nuxt"],
  app: { head: { title: "Easy tracker" } },
});
