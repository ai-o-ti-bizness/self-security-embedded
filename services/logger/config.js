'use strict'

const logDir = process.env.LOG_PATH || '/tmp'
const environment = process.env.NODE_ENV || 'Embedded'

module.exports = {
  /** Environment name of app execution
   * @type {string}
  */
  environment,
  /** Check if app is in testing environment
   * @type {boolean}
  */
  isTest: environment === 'TEST',
  /** Logging directory
   * @type {string}
  */
  logDir
}
