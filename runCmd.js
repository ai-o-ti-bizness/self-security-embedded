'use strict'

const path = require('path')
const mainPath = require.main.filename.includes('node_modules') ? path.join(path.dirname(require.main.filename), '../../..') : path.dirname(require.main.filename)
const { exec } = require('child_process')

/**
 * @typedef {Object} ExecCmdReturn
 * @property {String} stout raw output from stdout
 * @property {String} stderr raw output from stderr
 */

/**
 * Exec command and returns a promise with the stdout, stderr.
 * @param {String} cmd
 * @returns {Promise<ExecCmdReturn>}
 */
const execCmd = async (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      // console.log(stdout)
      resolve({ stdout, stderr })
    })
  })
}

module.exports = {
  execCmd
}