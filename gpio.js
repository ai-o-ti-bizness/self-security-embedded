const { Gpio } = require('onoff')

const greenLed = 4
const redLed = 5

const setPin = (pin = 4, value = 0) => {
  const LED = new Gpio(pin, 'out')
  LED.writeSync(value)
}

const toogleGpio = async (pin = 4) => {
  setPin(redLed, 1)
  setTimeout(() => {
    setPin(redLed, 0)
  }, 4000);
}

module.exports = {
  toogleGpio,
  greenLed,
  redLed
}
