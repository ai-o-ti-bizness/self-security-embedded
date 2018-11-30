'use strict'

const request = require('request-promise')
const http = require('http')

const { logger: defaultLogger } = require('../logger')(module)

const REGEX_SUCESS_STATUS_CODES = /^2/

const defaultOptions = {
  simple: false,
  resolveWithFullResponse: true,
  logger: defaultLogger
}

/**
 * @typedef {Object} HttpClientInstance
 * @property {import('request-promise').RequestPromise} client - The internal request-promise instance
 * @property {Function} callHTTP
 * @property {Function} getHTTPWithFormatter
 */
/**
 * Returns a http client instance
 * @param {Object} [clientOptions] Options to instantiate a http client
 * @param {Boolean} [clientOptions.simple=false] - Set simplier requests returns (ex: throw error when not 2xx) (default: false)
 * @param {Boolean} [clientOptions.resolveWithFullResponse=true] - Hide some properties (default: true)
 * @param {winston.Logger} [clientOptions.logger] - Custom log instance
 */
const createClient = ({ simple = false, resolveWithFullResponse = true, logger = defaultLogger } = defaultOptions) => {
  const clientOptions = { simple, resolveWithFullResponse }
  const client = request.defaults(clientOptions)

  return {
    client,
    /** Do a http call logs results and returns the response promise
     * @param {string} method HTTP Method.
     * @param {string} url URL string with protocol (Starting with http:// or https://).
     * @param {object} headers Request headers.
     * @param {object} body Request body (json).
     * @param {Boolean} disableBodyLog Disable body log.
     * @returns {Promise<import('request-promise').RequestPromise>} Promise object that represents the response
    */
    callHTTP: async (method, url, headers, body, disableBodyLog) => {
      const options = {
        method: method,
        uri: url,
        headers,
        body,
        json: true
      }

      try {
        const result = await client(options)
        const message = {
          method: options.method,
          uri: options.uri,
          headers: options.headers,
          statusCode: result.statusCode,
          responseMessage: result.message
        }
        if (!disableBodyLog) message.body = body
        if (!(REGEX_SUCESS_STATUS_CODES.test('' + result.statusCode))) {
          logger.error('HTTP Request Error: \n', message)
        } else {
          logger.info('HTTP Request Sent Result: \n', message)
        }
        return result
      } catch (err) {
        logger.error(err)
        throw err
      }
    },

    /**
     * @description Do a HTTP GET, modify both req and res objects, and optionally receives a
     * @param {Object} config — Config object for request
     * @param {string} config.url url
     * @param {Object} config.req req Object
     * @param {Object} config.res res Object
     * @param {Function} C0nfig.f0rmatter formatter
     * @returns {Promise} Promise with error or empty
    */
    getHTTPWithFormatter: ({ url, req, res, formatter = (originalResponse) => originalResponse.pipe(res) }) => {
      return new Promise((resolve, reject) => {
        const newReq = http.request(url, (originalResponse) => {
          const message = {
            method: 'GET',
            uri: url,
            statusCode: originalResponse.statusCode,
            responseHeaders: originalResponse.headers
          }

          if (!(REGEX_SUCESS_STATUS_CODES.test('' + originalResponse.statusCode))) {
            logger.error(' HTTP Request Error: \n ', message)
          } else {
            logger.info(' HTTP Request Sent Result: \n ', message)
          }

          formatter(originalResponse)
        })
          .on('error', (err) => {
            logger.error(err.message)
            reject(err)
          })
          .on('end', resolve)
        req.pipe(newReq)
      })
    }
  }
}

module.exports = createClient
