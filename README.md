# vue-cli2-ssr-template

> 提供基于webpack4与vue-cli2版本上的ssr改造模板

## 升级webpack4.x
本项目是由vue-cli@2.9.6版本创建的模板，创建之后默认的webpack版本为webpack@3.6.1，因此创建完项目之后的第一件事就是进行webpack4.x的改造。

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

其中`"mini-css-extract-plugin": "^0.4.3",`用来替代`extract-text-webpack-plugin`
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

const { VueLoaderPlugin } = require('vue-loader')

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
