const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a name'],
		},
		email: {
			type: String,
			required: [true, 'Please add an email'],
			unique: true,
			validate: {
				validator(email) {
					return validator.isEmail(email)
				},
				message: (props) => `${props.value} is not a valid email!`,
			},
		},
		role: {
			type: String,
			enum: ['user', 'publisher'],
			default: 'user',
		},
		password: {
			type: String,
			required: [true, 'Please add a password'],
			minlength: 6,
			select: false, // don't include password whenever a User object is fetched via the API
		},
		resetPasswordToken: String,
		resetPasswordExpire: Date,
	},
	{
		timestamps: true,
	}
)

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
	const salt = await bcrypt.genSalt(10)
	this.password = await bcrypt.hash(this.password, salt)

	next()
})

// Sign JWT and return
UserSchema.methods.getSignedJwt = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	})
}

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', UserSchema)
