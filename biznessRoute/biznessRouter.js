'use strict'

const { Router } = require('express')

const bizness = (req, res, next) => {
  res.status(200).send({ 'Bizness': 'Hello jorge' })
}

const router = Router()
router.route('/bizness').get(bizness)

module.exports = router
