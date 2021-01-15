const ErrorResponse = require('../utils/errorResponse')

const errorHandler = (err, req, res, next) => {
	let error = { ...err } // only copies enumerable properties, err.message is not enumerable

	// It can be coming from Express or from Mongoose or from somewhere else, depending on what causes the error (like error in the code, or bad request, or wrong input, or validation and so on...) and depending on who catches the error we may or may not receive a message. This is why we try to create a generic error handler that would return informative responses to the API user, at least for the most common cases.
	// Basically err.message is not an enumerable property
	error.message = err.message

	// Log to console for dev
	console.log(err)

	// Mongoose bad ObjectId
	if (err.name === 'CastError') {
		const message = `Resource with id of ${err.value} not found`
		error = new ErrorResponse(message, 404) // for casterrors, discard the previously copied error, and create a new one
	}

	// Mongoose duplicate key
	if (err.code === 11000) {
		const message = `Duplicate field value entered`
		error = new ErrorResponse(message, 400)
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map(
			(val) => ' ' + val.message + ' '
		)
		error = new ErrorResponse(message, 400)
	}

	res
		.status(error.statusCode || 500)
		.json({ success: false, error: error.message || 'Server Error' })
}

module.exports = errorHandler
