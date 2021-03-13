const express = require('express')
const {
	getBootcamps,
	getBootcamp,
	createBootcamp,
	updateBootcamp,
	deleteBootcamp,
	getBootcampsWithinRadius,
	bootcampPhotoUpload,
} = require('../controllers/bootcamps')

const advancedResults = require('../middleware/advancedResults')
const Bootcamp = require('../models/Bootcamp')
const { protect } = require('../middleware/auth')

// Include other resource routers
const courseRouter = require('./courses')

const router = new express.Router()

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampsWithinRadius)

router.route('/:id/photo').put(protect, bootcampPhotoUpload)

router
	.route('/')
	.get(advancedResults(Bootcamp, 'courses'), getBootcamps)
	.post(protect, createBootcamp)

router
	.route('/:id')
	.get(getBootcamp)
	.put(protect, updateBootcamp)
	.delete(protect, deleteBootcamp)

module.exports = router
