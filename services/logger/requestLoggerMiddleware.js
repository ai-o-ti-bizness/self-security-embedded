const morgan = require('morgan')
morgan.token('request-id', req => req.id)
morgan.token('qs', req => JSON.stringify(req.query))
morgan.token('raw-path', req => req.route.path)
morgan.token('content-length', (_, res) => res.get('content-length'))
morgan.token('Authorization', req => req.headers['authorization'])
const morganFormatStr = ':request-id :method :raw-path :url :qs :status :response-time[0]ms :content-length :referrer :user-agent :Authorization'

const { logger } = require('./index')(module)

// This is a more reliable and simplier version of morganJson
// without Eval and code quality violations
// Receives a morganFormat string and outputs a morganFormat that outputs in JSON format
const morganToJsonCompile = (morganFormat, opts) => {
  const parameters = morganFormat.split(':').map(t => t.trim()).filter(t => t !== '').map(p => {
    const rawParameter = p.split('[')
    if (rawParameter.length > 1) {
      const rawExtraInputs = rawParameter[1].split(']')
      const extraInputs = rawExtraInputs[0].split(',').map(t => t.trim()).filter(t => t !== '')
      return {
        name: rawParameter[0],
        extraInputs,
        sufix: rawExtraInputs[1]
      }
    } else {
      return {
        name: rawParameter[0]
      }
    }
  })

  // Returns middleware
  return (tokens, req, res) => {
    const retObj = {}
    parameters.forEach(parameter => {
      if (parameter.extraInputs) retObj[parameter.name] = tokens[parameter.name](req, res, ...parameter.extraInputs) + parameter.sufix
      else retObj[parameter.name] = (tokens[parameter.name](req, res) || '-') + ''
    })
    return JSON.stringify(retObj, undefined, 2)
  }
}

/**
 * Returns an Express middleware to log requests
 * @param {Object} logConfig - Request logging configuration
 * @param {Function} [logConfig.loggerFunction] - Custom logging function
 * @param {string[]} [logConfig.routesToIgnore] - Routes to ignore when logging
 */
const logRequestsConstructor = ({ loggerFunction = logger.info, routesToIgnore = [] } = { loggerFunction: logger.info, routesToIgnore: [] }) => {
  return morgan(morganToJsonCompile(morganFormatStr), {
    stream: {
      write: message => loggerFunction('Request received:\n', message)
    },
    skip: req => routesToIgnore.includes(req.baseUrl) || routesToIgnore.includes(req.originalUrl)
  })
}

module.exports = logRequestsConstructor
