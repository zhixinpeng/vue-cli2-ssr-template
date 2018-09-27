import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'

Vue.config.productionTip = false

export function createApp () {
  // 创建router和store实例
  const router = createRouter()
  const store = createStore()

  // 同步路由状态(router state)到store
  sync(store, router)

  // 创建应用程序实例，将router和store注入
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  // 暴露app, router 和 store
  return { app, router, store }
}
