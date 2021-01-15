const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const ErrorResponse = require('../utils/errorResponse')

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	// Copy req.query
	const reqQuery = { ...req.query }

	// Fields to exclude
	const removeFields = ['select', 'sort', 'page', 'limit']

	// Loop over removeFields and delete them from reqQuery
	removeFields.forEach((param) => {
		delete reqQuery[param]
	})

	// Create query string from object
	let queryStr = JSON.stringify(reqQuery)

	// Look for operators ($gt, $gte, etc)
	queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => '$' + match)

	// Finding resource
	let query = Bootcamp.find(JSON.parse(queryStr))

	// Select fields
	if (req.query.select) {
		const fields = req.query.select.split(',').join(' ')
		query = query.select(fields)
	}

	// Sort
	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join(' ')
		query = query.sort(sortBy)
	} else {
		// Default: Sort by date (latest)
		query = query.sort('-createdAt')
	}

	// Pagination
	const page = parseInt(req.query.page) || 1
	const limit = parseInt(req.query.limit) || 25
	const startIndex = (page - 1) * limit // starts with 0
	const endIndex = page * limit
	const total = await Bootcamp.countDocuments()

	query = query.skip(startIndex).limit(limit)

	// Executing query
	const bootcamps = await query

	const pagination = {}

	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		}
	}

	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit,
		}
	}

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		pagination,
		data: bootcamps,
	})
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
	const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		validators: true,
	})

	if (!bootcamp) {
		return next(
			// return is important here
			new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404)
		)
	}

	res.status(200).json({ success: true, data: bootcamp })
})

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id)

	if (!bootcamp) {
		return next(
			// return is important here
			new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404)
		)
	}

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
