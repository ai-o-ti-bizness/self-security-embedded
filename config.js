'use strict'

const port = process.env.PORT || 8080
const logDir = process.env.LOG_PATH || '/tmp'
const host = process.env.HOST_BASE || 'https://w-a-aas.herokuapp.com:' + port

const environment = process.env.NODE_ENV

module.exports = {
  /** Check if app is in testing environment
   * @type {boolean}
   */
  isTest: environment === 'TEST',
  /** Logging directory
   * @type {String}
   */
  logDir,
  /** Port of app execution
   * @type {String}
   */
  port
}
