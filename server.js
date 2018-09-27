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
