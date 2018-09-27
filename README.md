# vue-cli2-ssr-template

> 提供基于webpack4与vue-cli2版本上的ssr改造模板

## 升级webpack4
本项目是由vue-cli2版本创建的模板，创建之后默认的webpack版本为webpack3，因此创建完项目之后的第一件事就是进行webpack4的改造。

### 升级依赖
首先是替换package.json中旧版本的依赖，安装最新版本的

```
"copy-webpack-plugin": "^4.5.2",
"css-loader": "^0.28.11",
"eslint": "^5.6.0",
"eslint-config-standard": "^12.0.0",
"eslint-friendly-formatter": "^4.0.1",
"eslint-loader": "^2.1.1",
"eslint-plugin-import": "^2.14.0",
"eslint-plugin-node": "^7.0.1",
"eslint-plugin-promise": "^4.0.1",
"eslint-plugin-standard": "^4.0.0",
"eslint-plugin-vue": "^5.0.0-beta.3",
"file-loader": "^1.1.11",
"friendly-errors-webpack-plugin": "^1.7.0",
"html-webpack-plugin": "^3.2.0",
"mini-css-extract-plugin": "^0.4.3",
"optimize-css-assets-webpack-plugin": "^5.0.1",
"postcss-loader": "^2.1.6",
"url-loader": "^1.1.1",
"vue-loader": "^15.4.2",
"vue-style-loader": "^4.1.2",
"vue-template-compiler": "^2.5.17",
"webpack": "^4.20.2",
"webpack-bundle-analyzer": "^3.0.2",
"webpack-cli": "^3.1.1",
"webpack-dev-server": "^3.1.9",
"webpack-merge": "^4.1.4"
```

`"mini-css-extract-plugin": "^0.4.3",`用来替代`extract-text-webpack-plugin`
和`eslint`有关的9⃣️个依赖也要注意升级到最新版本
升级过程中注意`vue-template-compiler`版本要与`vue`的版本保持一致
另外建议在`webpack`构建流程中使用到的`loaders`及`plugins`都升级到最新版本
升级完以上依赖之后，最好删除`node_modules`文件夹重新安装一遍依赖，接下来针对配置文件进行修改

### 修改开发环境配置`webpack.dev.conf.js`
添加`mode: 'development'`，去掉`new webpack.NamedModulesPlugin()`与`new webpack.NoEmitOnErrorsPlugin()`这两个插件，因为webpack4开发模式已经内置

```javascript
// webpck.dev.conf.js
const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  // ...
  plugins: [
    // new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    // new webpack.NoEmitOnErrorsPlugin(),
  ]
})
```

### 修改生产环境配置`webpack.prod.conf.js`
添加`mode: 'production'`及`optimization`配置，同事注释掉`webpack.optimize.CommonsChunkPlugin`、`uglifyjs-webpack-plugin`、`webpack.optimize.ModuleConcatenationPlugin`相关配置及引用。
另外由于`extract-text-webpack-plugin`已经不再支持webpack4，[Since webpack v4 the extract-text-webpack-plugin should not be used for css. Use mini-css-extract-plugin instead.](https://github.com/webpack-contrib/extract-text-webpack-plugin)。因此需要更换为`mini-css-extract-plugin`,除了修改`webpack.prod.conf.js`，还需要修改`utils.js`

```javascript
// webpack.prod.conf.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  // ...
  // webpack4内置了optimization.splitChunks、optimization.runtimeChunk用来抽取代码，优化了缓存策略
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial',
          name: 'vendors'
        },
        'async-vendors': {
          test: /[\\/]node_modules[\\/]/,
          minChunks: 2,
          chunks: 'async',
          name: 'async-vendors'
        }
      }
    },
    runtimeChunk: { name: 'runtime' }
  },
  plugins: [
    // new UglifyJsPlugin({
    //   uglifyOptions: {
    //     compress: {
    //       warnings: false
    //     }
    //   },
    //   sourceMap: config.build.productionSourceMap,
    //   parallel: true
    // }),
    // extract css into its own file
    // new ExtractTextPlugin({
    new MiniCssExtractPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      // Setting the following option to `false` will not extract CSS from codesplit chunks.
      // Their CSS will instead be inserted dynamically with style-loader when the codesplit chunk has been loaded by webpack.
      // It's currently set to `true` because we are seeing that sourcemaps are included in the codesplit bundle as well when it's `false`,
      // increasing file size: https://github.com/vuejs-templates/webpack/issues/1110
      allChunks: true,
    }),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   minChunks (module) {
    //     // any required modules inside node_modules are extracted to vendor
    //     return (
    //       module.resource &&
    //       /\.js$/.test(module.resource) &&
    //       module.resource.indexOf(
    //         path.join(__dirname, '../node_modules')
    //       ) === 0
    //     )
    //   }
    // }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'manifest',
    //   minChunks: Infinity
    // }),
    // This instance extracts shared chunks from code splitted chunks and bundles them
    // in a separate chunk, similar to the vendor chunk
    // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'app',
    //   async: 'vendor-async',
    //   children: true,
    //   minChunks: 3
    // }),
  ]
})
```

### 修改基本配置`webpack.base.conf.js`
由于`vue-loader`15.x版本的问题，我们需要添加一个plugin

```javascript
// webpack.base.conf.js

const VueLoaderPlugin = require('vue-loader/lib/plugin')

//...
plugins: [
  new VueLoaderPlugin()
]
```

### 修改`utils.js`
由于`mini-css-extract-plugin`用来替代`extract-text-webpack-plugin`，除了上面的`webpack.prod.conf.js`文件需要修改，`utils.js`文件也需要修改

```javascript
// utils.js

// const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

// ...

// generate loader string to be used with extract text plugin
function generateLoaders (loader, loaderOptions) {
  const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

  if (loader) {
    loaders.push({
      loader: loader + '-loader',
      options: Object.assign({}, loaderOptions, {
        sourceMap: options.sourceMap
      })
    })
  }

  // Extract CSS when that option is specified
  // (which is the case during production build)
  // if (options.extract) {
  //   return ExtractTextPlugin.extract({
  //     use: loaders,
  //     fallback: 'vue-style-loader'
  //   })
  // } else {
  //   return ['vue-style-loader'].concat(loaders)
  // }

  // 升级webpack4，由 ExtractTextPlugin 改用 MiniCssExtractPlugin
  return [
    options.extract ? MiniCssExtractPlugin.loader : 'vue-style-loader'
  ].concat(loaders)
}
```

此时再次运行`npm run dev`与`npm run build`，项目就能成功运行了

## SSR的webpack配置修改
Vue的SSR渲染需要增加以下依赖`vue-server-renderer`、`webpack-node-externals`、`vuex-router-sync`、`express`、`html-minifier`、`cross-env`

### 修改`vue-loader.conf.js`
将extract的值设置为false，因为服务端渲染会自动将CSS内置，如果使用该extract，则会引入link标签载入CSS，从而导致相同的CSS资源重复加载

```javascript
// vue-loader.conf.js

loaders: utils.cssLoaders({
  sourceMap: sourceMapEnabled,
  // extract: isProduction
  extract: false
}),
```

### 修改`webpack.base.conf.js`
只需要修改entry入口即可

```javascript
// webpack.base.conf.js

entry: {
  // app: './src/main.js'
  app: './src/entry-client.js'
}
```

### 修改`webpack.prod.conf.js`
包括应用vue-server-renderer、去除HtmlWebpackPlugin、增加client环境变量

```javascript
// webpack.base.conf.js

// const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

// ...
const webpackConfig = merge(baseWebpackConfig, {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      'process.env': env,
      'process.env.VUE_ENV': '"client"'
    }),
    // new HtmlWebpackPlugin({
    //   filename: config.build.index,
    //   template: 'index.html',
    //   inject: true,
    //   minify: {
    //     removeComments: true,
    //     collapseWhitespace: true,
    //     removeAttributeQuotes: true
    //     // more options:
    //     // https://github.com/kangax/html-minifier#options-quick-reference
    //   },
    //   // necessary to consistently work with multiple chunks via CommonsChunkPlugin
    //   chunksSortMode: 'dependency'
    // }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ]),
    new VueSSRClientPlugin()
  ]
})
```

### 新增`webpack.server.conf.js`
这里要注意一个`vue-loader@15.x`的问题，除了要按照[Vue SSR 指南](https://ssr.vuejs.org/zh/guide/build-config.html#%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%85%8D%E7%BD%AE-server-config)配置，还需要修改`whitelist`，最重要的是需要增加一个额外的`css-loader`配置。如果不配置这一项，客户端打包能成功，服务端打包会提示以下报错
```
ERROR in ./src/components/HelloWorld.vue?vue&type=style&index=0&id=32c66ed9&scoped=true&lang=css& (./node_modules/_vue-loader@15.4.2@vue-loader/lib??vue-loader-options!./src/components/HelloWorld.vue?vue&type=style&index=0&id=32c66ed9&scoped=true&lang=css&) 86:3
Module parse failed: Unexpected token (86:3)
You may need an appropriate loader to handle this file type.
```

因此，最终配置如下：

```javascript
// webpack.server.conf.js

const webpack = require('webpack')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const baseConfig = require('./webpack.base.conf')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')

module.exports = merge(baseConfig, {
  entry: './src/entry-server.js',
  target: 'node',
  devtool: 'source-map',
  output: {
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  externals: nodeExternals({
    whitelist: [/\.css$/, /\?vue&type=style/]
  }),
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.VUE_ENV': '"server"'
    }),
    new VueSSRServerPlugin()
  ]
})
```

## 入口配置
在浏览器端渲染中，入口文件是`main.js`，而到了服务端渲染，除了基础的main.js，还需要配置`entry-client.js`与`entry-server.js`

### 修改`main.js`
```javascript
// main.js

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
```

### 新增`entry-client.js`
```javascript
// entry-client.js

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
  beforeRouteUpdate(to, from, next) {
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
function notify(title) {
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
```

### 新增entry-server.js
```javascript
// entry-server.js

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
```

## 组件及文件修改
由于代码需要在服务器端与浏览器端公用，所以需要修改部分文件及组件，使之不会在服务器端报错

### 修改`router/index.js`
每个页面请求都应该暴露出一个新的router路由实例

```javascript
// router/index.js

import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      {
        path: '/',
        component: () =>
          import(/* webpackChunkName: 'home' */ '@/components/HelloWorld')
      }
    ]
  })
}

```

### 修改`store/index.js`
修改状态管理文件，每次请求都暴露一个新的vuex实例
这里先写了一个简单的计数器状态管理

```javascript
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export function createStore () {
  return new Vuex.Store({
    state: {
      count: 0
    },
    mutations: {
      SET_COUNT (state, num) {
        state.count = num
      }
    },
    actions: {
      incrementCount ({ commit, state }) {
        commit('SET_COUNT', state.count + 1)
      },

      decrementCount ({ commit, state }) {
        commit('SET_COUNT', state.count - 1)
      }
    }
  })
}

```

### 使用asyncData方法来获取异步数据
要特别注意的是，由于asyncData只能通过路由发生作用，使用非路由组件的异步数据获取最好移动到路由组件中
如果要通过asyncData获取多个数据，可以使用`Promise.all()`方法

```javascript
// components/HelloWorld.vue

asyncData({ store, route }) {
  console.log('async Data...')
  return new Promise(resolve => setTimeout(resolve, 300))
}
```

关于数据预取和状态，进一步聊天请参考[官网文档](https://ssr.vuejs.org/zh/guide/data.html#%E6%95%B0%E6%8D%AE%E9%A2%84%E5%8F%96%E5%AD%98%E5%82%A8%E5%AE%B9%E5%99%A8-data-store)

## 服务器配置

### 新建`server.js`
在根目录下，新建`server.js`文件

由于在webpack中去除了HTMLWebpackPlugin插件，而是通过Node来处理模板，同时也就缺少了该插件设置的HTML文件压缩功能

因此需要在`server.js`中安装`html-minifier`来实现HTML文件压缩

```javascript
//server.js

const express = require('express')
const fs = require('fs')
const path = require('path')
const { createBundleRenderer } = require('vue-server-renderer')
const { minify } = require('html-minifier')

const resolve = filepath => path.resolve(__dirname, filepath)
const app = express()

const renderer = createBundleRenderer(require('./dist/vue-ssr-server-bundle.json'), {
  runInNewContext: false,
  template: fs.readFileSync(resolve('./index.template.html'), 'utf8'),
  clientManifest: require('./dist/vue-ssr-client-manifest.json'),
  basedir: resolve('./dist')
})

// 设置静态资源目录
app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html')

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if (err.code === 404) {
      res.status(404).send('404 | Page Not Found')
    } else {
      res.status(500).send('500 | Internal Server Error')
      console.error(`error during render : ${req.url}`)
      console.error(err.stack)
    }
  }

  const context = {
    title: 'VUE-CLI2-SSR-TEMPLATE',
    url: req.url
  }

  renderer.renderToString(context, (err, html)=>{
    console.log(err)
    if(err){
      return handleError(err)
    }
    res.send(minify(html, { collapseWhitespace: true, minifyCSS: true}))
  })
})

app.on('error', err => console.log(err))
app.listen(4000, ()=>{
  console.log('vue ssr started at http://localhost:4000')
})
```

### 新建`index.template.html`
`index.template.html`文件是服务端渲染HTML的模板，其中的`{{}}`用来显示`context`中的数据插值

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>{{title}}</title>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>

```

### 修改`package.json`运行脚本
```json
"build:client": "node build/build.js",
"build:server": "cross-env NODE_ENV=production webpack --config build/webpack.server.conf.js --progress --hide-modules",
"build": "rimraf dist && npm run build:client && npm run build:server",
"server": "node server.js"
```

## 测试
本地开发
```
npm run dev
```
构建打包
```
npm run build
```

服务端运行
```
npm run server
```
