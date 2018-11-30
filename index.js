'use strict'

const express = require('express')
const { port, isTest } = require('./config')

const uuidv4 = require('uuid/v4')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const { logger } = require('./services/logger')(module)
const setId = require('./services/logger/setId')
const logRequests = require('./services/logger/requestLoggerMiddleware')({ routesToIgnore: ['/health', '/swagger-ui'] })

const biznessRoute = require('./biznessRoute/biznessRouter')
const os = require('os')

// Authorization headers
const allowedHeaders = [
  'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Cache-Control',
  'Pragma', 'Expires', 'login', 'registration', 'Authorization',
  'X-Session-Id'
].join(', ')

const exposedHeaders = ['Content-Disposition', 'Filename', 'X-Soft-Token'].join(', ')

// Server variables
const app = express()
let server
const openHttpConnections = {}

// Middlewares functions definitions for Express

// Gives unique id for each request
const setRequestId = (req, res, next) => {
  req.id = uuidv4()
  next()
}

// Set partial CORS support
const setAuthorizationHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', allowedHeaders)
  res.header('Access-Control-Expose-Headers', exposedHeaders)
  next()
}

// Error handling and process exiting
const shutdown = async (code) => {
  server.close(async () => {
    logger.info('Web server closed')
    process.exit(code)
  })

  for (const key in openHttpConnections) {
    openHttpConnections[key].destroy()
  }
}

const handleError = (err, req, res, next) => {
  logger.error({ requestId: req.id, err })
}

// Events handlers when closing server
process.on('uncaughtException', async (err) => {
  logger.error('Uncaught Exception\n', err)
  shutdown(1)
})

process.on('SIGTERM', () => {
  logger.error('Received SIGTERM')
  shutdown(0)
})

process.on('SIGINT', () => {
  logger.error('Received SIGINT')
  shutdown(0)
})

/**
 * Configure routes and other middlewares supported by this server
 * @param {import('express').Express} app
 */
const init = async (app) => {
  app.use(setRequestId)
  app.use(setId)
  app.use(bodyParser.json())
  app.use(helmet())
  app.use(handleError)
  app.all('/*', setAuthorizationHeaders)
  app.use(logRequests)

  app.get('/', (req, res) => res.json({ status: 'The Self-Security-Embedded API lives!' }))

  app.use(biznessRoute)

  if (!isTest) {
    try {
      server = app.listen(port, () => {
        logger.info(`Started WebServer in ${process.env.PWD} on ${os.userInfo().username}@${'raspberry'} at port ${port}`)
	      logger.info('Quiero ver el negocio')
      })

      // Save connection
      server.on('connection', httpConnection => {
        const key = `${httpConnection.remoteAddress}:${httpConnection.remotePort || ''}`
        openHttpConnections[key] = httpConnection
        httpConnection.on('close', () => delete openHttpConnections[key])
      })
	//await detectDevices()
    } catch (err) {
      logger.error(`Error occurred when tried to listen to port ${port}\n`, err)
      logger.info('Exiting process')
      process.exit()
    }
  }

  return app
}

module.exports = init(app)
