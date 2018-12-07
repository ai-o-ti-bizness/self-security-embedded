'use strict'
const { execCmd } = require('./runCmd')
const sendMail = require('./sendMail')

/**
 * @typedef {Object} BluetoothDevice
 * @property {String} btId
 * @property {String} desc
 */

/**
 * Gets ifConfig
 */
const runSearch = async () => {
  return {
    ifcon: (await execCmd(`sudo ifconfig`)).stdout,
    ssid: (await execCmd(`sudo iwgetid -r`)).stdout
  }
}

/**
 * Returns a list of bluetooth devices in range
 * @returns {BluetoothDevice[]}
 */
const sendIfConfig = async () => {
  const result = await runSearch()
  await sendMail({
    body: `
<html>
<head></head>
<body>
${JSON.stringify(result.ifcon, undefined, 2).replace(/\\n/gu, '<br>')}
</body>
</html>
    `,
    subject: 'Resultado do ifconfig do SSID: ' + result.ssid
  })
  return result
}

module.exports = { sendIfConfig }
