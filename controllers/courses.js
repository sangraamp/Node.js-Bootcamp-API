const Course = require('../models/Course')
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
	res.status(200).send(res.advancedResults)
})

// @desc    Get course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id).populate({
		path: 'bootcamp',
		select: 'name description',
	})

	if (!course) {
		return next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
	}

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc    Add course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
exports.addCourse = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId
	req.body.user = req.user.id // protected route, so we have access to req.user

	const bootcamp = await Bootcamp.findById(req.params.bootcampId)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`No bootcamp with id of ${req.params.bootcampId}`, 404)
		)
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.user.id} not authorized to add a course to bootcamp ${bootcamp._id}`,
				401
			)
		)
	}

	const course = await Course.create(req.body)

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
	let course = await Course.findById(req.params.id)

	if (!course) {
		return next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
	}

	// Make sure user is course owner
	if (course.user.toString() !== course.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.user.id} not authorized to update course ${course._id}`,
				401
			)
		)
	}

	course = await Course.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id)

	if (!course) {
		return next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
	}

	// Make sure user is course owner
	if (course.user.toString() !== course.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.user.id} not authorized to delete course ${course._id}`,
				401
			)
		)
	}

	await course.remove()

	res.status(200).json({
		success: true,
		data: {},
	})
})
