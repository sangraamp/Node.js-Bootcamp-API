const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const ErrorResponse = require('../utils/errorResponse')
const path = require('path')

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults)
})

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			// return is important here
			new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404)
		)
	}

	res.status(200).send({ success: true, data: bootcamp })
})

// @desc    Create new bootcamps
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	// Add user to req.body
	req.body.user = req.user

	// Check for published bootcamp
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

	// If the user is not an admin, they can only add one bootcamp
	if (publishedBootcamp && !req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`The user with ID ${req.user.id} has already published a bootcamp`,
				400
			)
		)
	}

	const bootcamp = await Bootcamp.create(req.body)

	res.status(201).json({
		success: true,
		data: bootcamp,
	})
})

// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			// return is important here
			new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404)
		)
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.params.id} not authorized to update this bootcamp`,
				401
			)
		)
	}

	bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true, // return updated Bootcamp
		runValidators: true,
	})

	res.status(200).json({ success: true, data: bootcamp })
})

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			// return is important here
			new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404)
		)
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.params.id} not authorized to delete this bootcamp`,
				401
			)
		)
	}

	bootcamp.remove()

	res.status(200).json({ success: true, data: {} })
})

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Public
exports.getBootcampsWithinRadius = asyncHandler(async (req, res, next) => {
	const { zipcode, distance } = req.params

	// Get lat/long from geocoder
	const loc = await geocoder.geocode(zipcode)
	console.log(loc)
	const { latitude, longitude } = loc[0]

	// Calc radians using distance
	// Earth's radius = 6,378 km
	// d = r * theta
	const radiusInRadians = distance / 6378

	const bootcamps = await Bootcamp.find({
		location: {
			$geoWithin: { $centerSphere: [[longitude, latitude], radiusInRadians] },
		},
	})

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	})
})

// @desc      Upload photo for bootcamp
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
		)
	}

	// Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			// return is important here
			new ErrorResponse(
				`User ${req.params.id} not authorized to update this bootcamp`,
				401
			)
		)
	}

	if (!req.files) {
		return next(new ErrorResponse(`Please upload a file`, 400))
	}

	const file = req.files.file

	// Make sure the image is a photo
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse(`Please upload an image file`, 400))
	}

	// Check filesize
	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
				400
			)
		)
	}

	// Create custom filename
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.error(err)
			return next(new ErrorResponse(`Problem with file upload`, 500))
		}

		await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

		res.status(200).json({
			success: true,
			data: file.name,
		})
	})
})
