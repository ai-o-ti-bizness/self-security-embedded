'use strict'
const { execCmd } = require('./runCmd')

/**
 * @typedef {Object} BluetoothDevice
 * @property {String} btId
 * @property {String} desc
 */

/**
 * Does a bluetooth search
 */
const runSearch = async () => {
  return execCmd(`sudo btmgmt find -l`)
}

/**
 * Parses a btmgmt result command
 * 
 * Discovery started
hci0 type 6 discovering on
hci0 dev_found: 33:CE:2F:F7:E7:E5 type LE Random rssi -66 flags 0x0004 
AD flags 0x00 
eir_len 31
hci0 type 6 discovering off
 */
const parseBtmgmtFindResult = (btmgmtStr) => {
  const devs = btmgmtStr.split('hci0 dev_found: ')
    .slice(1)
    .map(c => c.split('hci0 type')[0])
    .map(raw => {
      const lines = raw.split('\n')
      const btAddress = lines[0].split(' ')[0]
      const rssi = Number(lines[0].slice(lines[0].indexOf('rssi'), lines[0].indexOf('flags')).trim().slice(5))
      const type = lines[0].slice(lines[0].indexOf('type ') + 5, lines[0].indexOf('rssi')).trim()
      const flags = lines[0].split('flags')[1].trim()
      const adflags = lines[1].split('flags')[1].trim()
      const eirLen = lines[2].slice(7)
      return {
        btAddress,
        rssi,
        type,
        flags,
        adflags,
        eirLen
      }
    })
  return devs
}

/**
 * Returns a list of bluetooth devices in range
 * @returns {BluetoothDevice[]}
 */
const doBluetoothWork = async () => {
  const result = await runSearch()
  console.log('**' + result.stdout + '**\n')
  return parseBtmgmtFindResult(result.stdout)
}

module.exports = { doBluetoothWork }
