import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import Ripple from 'primevue/ripple'

import 'primeicons/primeicons.css'
import 'vue3-toastify/dist/index.css'
import './style.css'

import { MyPreset } from './config/theme/ThemePreset'

import App from './App.vue'
import router from './router'
import DateLocale from './locales/Date'
import Tooltip from 'primevue/tooltip'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import { VueQueryPlugin } from '@tanstack/vue-query'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  },
})

app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)
app.use(PrimeVue, {
  locale: {
    ...DateLocale,
  },
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: 'light',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
})
app.use(Vue3Toastify, {
  autoClose: 7500,
  theme: 'colored',
  limit: 5,
  dangerouslyHTMLString: true,
} as ToastContainerOptions)
app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

app.mount('#app')
