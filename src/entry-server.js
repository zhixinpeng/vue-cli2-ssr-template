import { createApp } from './main'

export default context => {
  // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个Promise
  // 以便服务器能够等待所有的内容在渲染前就已经准备就绪
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()

    // 设置服务器端router的位置
    router.push(context.url)

    // 等到router将可能的异步组件和钩子函数解析完
    router.onReady(() => {
      console.log('server entry')
      const matchedComponents = router.getMatchedComponents()
      // 匹配不到的路由，执行reject函数，并返回404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // 对所有匹配的路由器组件调用 `asyncData()`
      Promise.all(matchedComponents.map(component => {
        if (component && component.asyncData) {
          return component.asyncData({
            store,
            route: router.currentRoute
          })
        }
      })).then(() => {
        // 在所有预取钩子resolve后，我们的store现在已经填充入渲染应用程序所需的状态
        // 当我们将状态附加到上下文，并且 `template` 选项用于 renderer时
        // 状态将自动序列化为 `window.__INITIAL_STATE__` ,并注入HTML
        context.state = store.state

        // Promise应该resolve应用程序实例，以便它可以渲染
        resolve(app)
      }).catch(reject)
    }, reject)
  })
}
