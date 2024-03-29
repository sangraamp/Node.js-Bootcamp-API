const User = require('../models/User')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/sendEmail')
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

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
	res.status(200).json({ success: true, data: req.user })
})

// @desc    Forgot password
// @route   GET /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email })

	if (!user) {
		return next(new ErrorResponse('There is no user with that email', 404))
	}

	// Get reset token
	const resetToken = await user.getResetPasswordToken()

	// Save user as we have updated their resetPassword fields
	// Haven't changed anything that needs validation again
	await user.save({ validateBeforeSave: false })

	// Create reset URL
	const resetUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/resetpassword/${resetToken}`

	const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

	try {
		await sendEmail({
			email: user.email,
			subject: 'Password reset token',
			message,
		})

		res.status(200).json({ success: true, data: 'Email sent' })
	} catch (err) {
		console.error(err)
		// Get rid of resetPassword fields
		user.resetPasswordToken = undefined
		user.resetPasswordExpire = undefined

		await user.save({ validateBeforeSave: false })

		return next(new ErrorResponse('Email could not be sent', 500))
	}

	res.status(200).json({ success: true, data: user })
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
