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

const { doBluetoothWork } = require('./bluetooth')
const { toogleGpio, redLed, greenLed } = require('./gpio')

const httpClient = require('./services/http-client')()
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

const loopOpenClose = async function () {
  let bts = await doBluetoothWork()
  logger.info('Bts: \n')
  logger.info(bts)
  if (bts.length > 0) {
    
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Email': 'admin@poli.usp.br',
      'Accept': 'application/json',
      'X-User-Token': 'W2AdicN4HSxRmvF9Uz5a'    
    }
    const body = {	
      device: {
        bluetooth_ids: bts.map(b => b.btAddress)
      }
    }
    const result = await httpClient.callHTTP('POST', 'http://self-security.herokuapp.com:80/verify', headers, body)


    logger.info('Devices:\n', bts.map(b => b.btAddress))
    if (result.statusCode === 200) {
      toogleGpio(greenLed)
    } else {
	    console.log('Unauthorized')
      toogleGpio(redLed)
    }
  }
  setTimeout(async () => {
    await loopOpenClose()
  }, 10);
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
	  } catch (err) {
      logger.error(`Error occurred when tried to listen to port ${port}\n`, err)
      logger.info('Exiting process')
      process.exit()
    }
  }
  await loopOpenClose()
  return app
}

module.exports = init(app)
