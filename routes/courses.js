const express = require('express')
const {
	getCourses,
	getCourse,
	addCourse,
	updateCourse,
	deleteCourse,
} = require('../controllers/courses')

const advancedResults = require('../middleware/advancedResults')
const Course = require('../models/Course')
const { protect } = require('../middleware/auth')

// Preserve the req.params values from the parent router.
const router = new express.Router({ mergeParams: true })

router
	.route('/')
	.get(
		advancedResults(Course, {
			path: 'bootcamp',
			select: 'name description',
		}),
		getCourses
	)
	.post(protect, addCourse)

router
	.route('/:id')
	.get(getCourse)
	.put(protect, updateCourse)
	.delete(protect, deleteCourse)

module.exports = router
