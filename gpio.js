const { Gpio } = require('onoff')

const greenLed = 4
const redLed = 5
const buzzerPin = 18
const blueWaitingLed = 23

const setPin = (pin = 4, value = 0) => {
  const LED = new Gpio(pin, 'out')
  LED.writeSync(value)
}

const toogleGpio = async (pin = 4) => {
  setPin(pin, 1)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      setPin(pin, 0)
      resolve()
    }, 4000)
  })
}

module.exports = {
  toogleGpio,
  greenLed,
  redLed,
  buzzerPin,
  blueWaitingLed,
  setPin
}

