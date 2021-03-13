const User = require('../models/User')
const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')
const bcrypt = require('bcryptjs')

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body

	const user = await User.create({ name, email, password, role })

	sendTokenResponse(user, 200, res)
})

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body

	// Validate email and password
	if (!email || !password) {
		return next(
			new ErrorResponse('Please provide an email and a password', 400)
		)
	}

	// Also include password in this case as we need it for verification
	// (by default it isn't included)
	const user = await User.findOne({ email }).select('+password')

	if (!user) {
		return next(new ErrorResponse('Invalid credentials', 401))
	}

	// Check if password matches
	const isMatch = await user.matchPassword(password)

	if (!isMatch) {
		return next(new ErrorResponse('Invalid credentials', 401))
	}

	sendTokenResponse(user, 200, res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
	// Create token
	const token = user.getSignedJwt()

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	}

	// Use https in production mode
	if (process.env.NODE_ENV === 'production') {
		options.secure = true
	}

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	})
}

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
	res.status(200).json({ success: true, data: req.user })
})
