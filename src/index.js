import 'babel-polyfill'
import express from 'express'
import renderer from '../src/helpers/renderer'
import { matchRoutes } from 'react-router-config'
import proxy from 'express-http-proxy'
import Routes from '../client/Routes'
const app = express()
import createStore from './helpers/createStore'

app.use(
  '/api',
  proxy('http://react-ssr-api.herokuapp.com', {
    proxyReqOptDecorator(opts) {
      opts.headers['x-forwarded-host'] = 'localhost:3000'
      return opts
    }
  })
)
app.use(express.static('public'))
app.get('*', (req, res) => {
  const store = createStore(req)
  const promiseArray = matchRoutes(Routes, req.path).map(({ route }) => {
    return route.loadData ? route.loadData(store) : null
  })
  Promise.all(promiseArray).then(() => {
    const context = {}
    const content = renderer(req, store, context)
    if (content.error) {
      res.status(404)
    }
    res.send(content)
  })
})

app.listen(3000, () => console.log('Listening on port 3000...'))
