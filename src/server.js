/* eslint-disable no-console */

import express from 'express'
import exitHook from 'async-exit-hook'
import { CLOSE_DB, CONNECT_DB, GET_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from '~/config/cors'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'


const START_SERVER = () => {
  const app = express()

  // https://stackoverflow.com/questions/22632593/how-to-disable-webpage-caching-in-expressjs-nodejs/53240717#53240717
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache')
    next()
  })

  app.use(cookieParser())

  app.use(cors(corsOptions))

  app.use(express.json())

  app.use('/v1', APIs_V1)

  //Middleware handle error
  app.use(errorHandlingMiddleware)

  // Tạo server bọc app của express để xử lý realtime với socket.io
  const server = http.createServer(app)
  // Khởi tạo biến io với server và cors
  const io = new socketIo.Server(server, {
    cors: corsOptions
  })

  io.on('connection', (socket) => {
    inviteUserToBoardSocket(socket)
  })

  if (env.BUILD_MODE === 'dev') {
    // Dùng server.listen thay vì app.listen vì server đã bao gồm expressApp và đã config socket.io
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`I am running at ${env.APP_HOST}:${env.APP_PORT}`)
    })
  } else {
    server.listen(process.env.PORT, () => {
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