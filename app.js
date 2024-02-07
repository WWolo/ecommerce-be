const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')

const app = express()

require('dotenv/config')

const api = process.env.API_URL

app.use(cors())
app.options('*', cors())

// middleware
app.use(express.json())
app.use(morgan('tiny'))
app.use(authJwt())
app.use('public/uploads', express.static(`${__dirname}public/uploads`))
app.use(errorHandler)

// router
const categoriesRouter = require('./routers/categories')
const ordersRouter = require('./routers/orders')
const productsRouter = require('./routers/products')
const usersRouter = require('./routers/users')

app.use(`${api}/categories`, categoriesRouter)
app.use(`${api}/orders`, ordersRouter)
app.use(`${api}/products`, productsRouter)
app.use(`${api}/users`, usersRouter)

mongoose
  .connect(process.env.DB_CONNECTION_STRING, {
    dbName: 'eshop-database',
  })
  .then(() => {
    console.log('Database Connection is ready...')
  })
  .catch(err => {
    console.log('Error :>> ', err)
  })

app.listen(3000, () => {
  console.log(api)
  console.log(`listening on http://localhost:3000`)
})
