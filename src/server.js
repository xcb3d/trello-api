/* eslint-disable no-console */

import express from 'express'
import exitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB, GET_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from '~/config/cors'
import cors from 'cors'

const START_SERVER = () => {
  const app = express()

  app.use(cors(corsOptions))

  app.use(express.json())

  app.use('/v1', APIs_V1)

  //Middleware handle error
  app.use(errorHandlingMiddleware)
  if (env.BUILD_MODE === 'dev') {
    app.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`I am running at ${env.APP_HOST}:${env.APP_PORT}`)
    })
  } else {
    app.listen(process.env.PORT, () => {
      console.log(`I am running at port ${process.env.PORT}`)
    })
  }

  exitHook(() => {
    console.log('Exiting...')
    CLOSE_DB()
    console.log('Exited.')
  })
}

// START_SERVER()

CONNECT_DB()
  .then(() => console.log('Connected'))
  .then(START_SERVER())
  .catch((e) => {
    console.error(e)
    process.exit()
  })