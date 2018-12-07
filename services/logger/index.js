'use strict'

const { createLogger, format, transports } = require('winston')
const fecha = require('fecha')

const fs = require('fs')
const path = require('path')
const { ERROR_FILENAME, COMBINED_FILENAME } = require('./constants').LOG_CONFIG
const { environment, logDir, isTest } = require('./config')
let consoleMode = process.env.CONSOLE_MODE || 'unescaped'

const LOGS_FOLDER = logDir

const TIMESTAMP_FORMAT = 'DD/MMM/YYYY HH:mm:ss UTC'
const fixDate = () => fecha.format(fecha.parse(new Date().toISOString(), 'YYYY-MM-DDTHH:mm:ss.SSS'), TIMESTAMP_FORMAT)

if (!fs.existsSync(LOGS_FOLDER)) {
  fs.mkdirSync(LOGS_FOLDER)
}

const getLabel = (callingModule) => {
  const parts = callingModule.filename.split('/')
  return { label: parts[parts.length - 2] + '/' + parts.pop() }
}

const getId = () => {
  let id
  if (process.env.USE_CONSOLE_ID) {
    const session = require('cls-hooked').getNamespace('logger')
    if (session) {
      id = session.get('id')
    }
  }
  return id
}

const fileMsgFormat = format.printf(info => {
  const id = getId()
  return JSON.stringify({
    severity: info.level,
    timestamp: info.timestamp,
    environment,
    file: info.label,
    message: info.message,
    id
  })
})

const consoleTransformation = info => {
  const str = `${info.timestamp} - ${environment} - ${info.level}: [${info.label}] ${info.message}`
  const id = getId()
  return id ? `[${id}] ${str}` : str
}

const consoleFormats = {
  escaped: info => consoleTransformation(info).replace(/\n/g, '\\n'),
  unescaped: consoleTransformation
}

const consoleMsgFormat = consoleMode === 'unescaped' ? format.printf(consoleFormats.unescaped) : format.printf(consoleFormats.escaped)

const addLogInterceptor = (logger, logFuncName) => {
  const internalFuncName = '_' + logFuncName
  logger[internalFuncName] = logger[logFuncName]
  logger[logFuncName] = (...args) => {
    const message = args.reduce((acc, current) => {
      if (typeof current === 'string') {
        return acc + current
      } else {
        if (current instanceof Error) {
          return acc + JSON.stringify({ name: current.name, message: current.message, stack: current.stack }, undefined, 2)
        } else {
          return acc + JSON.stringify(current, undefined, 2)
        }
      }
    }, '')
    logger[internalFuncName](message)
  }
}

const addLogMultipleWrapper = (logger) => {
  ['error', 'warn', 'info', 'verbose', 'debug', 'silly'].forEach(level => addLogInterceptor(logger, level))
}

const getTransportAllLogs = (callingModule) => {
  return new transports.File({
    filename: path.resolve(LOGS_FOLDER, COMBINED_FILENAME),
    format: format.combine(
      format.timestamp({ format: fixDate }),
      format.label(getLabel(callingModule)),
      fileMsgFormat
    )
  })
}

const getTransportErrorLogs = (callingModule) => {
  return new transports.File({
    filename: path.resolve(LOGS_FOLDER, ERROR_FILENAME),
    level: 'error',
    format: format.combine(
      format.timestamp({ format: fixDate }),
      format.label(getLabel(callingModule)),
      fileMsgFormat
    )
  })
}

const getTransportConsoleLogs = (callingModule) => {
  return new transports.Console({
    format: format.combine(
      format.timestamp({ format: fixDate }),
      format.label(getLabel(callingModule)),
      consoleMsgFormat
    )
  })
}

const createLoggerFromModule = (callingModule, skipConsole = isTest, mode = consoleMode) => {
  consoleMode = mode
  let transports = [
    getTransportAllLogs(callingModule),
    getTransportErrorLogs(callingModule)
  ]

  const consoleTransport = getTransportConsoleLogs(callingModule)
  if (!skipConsole) transports.push(consoleTransport)

  const logger = createLogger({ transports })

  addLogMultipleWrapper(logger)
  return {
    logger,
    consoleFormats,
    LOGS_FOLDER,
    LOGS_FOLDER_NAME: logDir,
    ERROR_FILENAME,
    COMBINED_FILENAME
  }
}

module.exports = createLoggerFromModule
