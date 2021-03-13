const express = require('express')
const { register, login, getMe } = require('../controllers/auth')
const { protect } = require('../middleware/auth')

const router = new express.Router()

router.route('/register').post(register)

router.route('/login').post(login)

router.route('/me').get(protect, getMe)

module.exports = router
