import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const { title } = to.meta
  const defaultTitle = 'IFF Back Office'

  document.title = title ? `${defaultTitle} : ${title}` : defaultTitle
})

// setupGuards(router)

export default router
