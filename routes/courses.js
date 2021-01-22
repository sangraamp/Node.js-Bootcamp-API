const express = require('express')
const {
	getCourses,
	getCourse,
	addCourse,
	updateCourse,
	deleteCourse,
} = require('../controllers/courses')

// Preserve the req.params values from the parent router.
const router = new express.Router({ mergeParams: true })

router.route('/').get(getCourses).post(addCourse)

router.route('/:id').get(getCourse).put(updateCourse).delete(deleteCourse)

module.exports = router
