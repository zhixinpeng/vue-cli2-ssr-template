import Vue from 'vue'
import { createApp } from './main'

const { app, router, store } = createApp()

// 数据预处理方式之二：匹配要渲染的视图后，再获取数据
// 当路由导航被触发时，可以立即切换视图，因此应用程序具有更快的响应速度
// 然而，传入视图在渲染时不会有完整的可用数据。因此对于使用此策略的每个视图组件，都需要具有条件加载状态
// Vue.mixin({
//   beforeMount() {
//     const { asyncData } = this.$options
//     if (asyncData) {
//       // 将获取数据操作分配给promise
//       // 以便在组件中，我们可以在数据准备就绪后通过运行 `this.dataPromise.then(...)` 来执行其他任务
//       this.dataPromise = asyncData({
//         store: this.$store,
//         route: this.$route
//       })
//     }
//   }
// })

// 无论采用两种策略的何种方式，取决于不同的用户体验决策，但是无论哪种策略，当路由组件重用，也应该调用asyncData函数
Vue.mixin({
  beforeRouteUpdate (to, from, next) {
    const { asyncData } = this.$options

    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  }
})

// 客户端在挂载app之前，store状态替换
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

// 数据预处理方式之一：在路由导航之前解析数据
// 好处在于可以直接在数据准备就绪时，传入视图渲染完整内容
// 但如果数据预取需要很长时间，用户在当前视图会感受到明显卡顿，因此使用此策略，建议提供一个数据加载指示器
router.onReady(() => {
  console.log('client entry')
  // 添加路由钩子函数，用于处理asyncData
  // 在初始路由resolve之后执行，以便我们不会二次预取已有的数据
  // 使用 `router.beforeResolve()`，以确保所有异步组件都resolve
  router.beforeResolve((to, from, next) => {
    const matchedComponents = router.getMatchedComponents(to)
    const prevMatchedComponents = router.getMatchedComponents(from)
    const activated = matchedComponents.filter((component, i) => component !== prevMatchedComponents[i])

    // 我们只关心非预渲染的组件
    // 所以我们对比它们，找出两个匹配列表的差异列表
    const activatedAsyncHooks = activated.map(component => component && component.asyncData).filter(Boolean)

    if (!activatedAsyncHooks.length) {
      return next()
    }

    // 这里如果有加载指示器，就触发
    notify('开始预取数据...')

    Promise.all(activatedAsyncHooks.map(hook => {
      hook({ store, route: to })
    })).then(() => {
      // 停止加载指示器
      console.log('ok')
      next()
    }).catch(next)
  })

  app.$mount('#app')
})

// 注册service-worker
if (window && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js')
}

// 浏览器通知函数
function notify (title) {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    return new Notification(title)
  } else {
    Notification.requestPermission(permission => {
      if (permission === 'granted') {
        return new Notification(title)
      }
    })
  }
}
