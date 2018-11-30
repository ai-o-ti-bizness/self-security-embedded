const uuidv4 = require('uuid/v4')
const cls = require('cls-hooked')
const ns = cls.createNamespace('logger')

module.exports = function clsifyMiddleware (req, res, next) {
  ns.bindEmitter(req)
  ns.bindEmitter(res)
  ns.run(() => {
    const correlationld = uuidv4()
    cls.getNamespace('logger').set('id', correlationld)
    next()
  })
}
