const mongoose = require('mongoose')
const validator = require('validator')

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
			validate(email) {
				if (!validator.isEmail(email)) {
					console.error('Please add a valid email')
				}
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

module.exports = mongoose.model('User', UserSchema)
