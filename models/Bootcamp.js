const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const geocoder = require('../utils/geocoder')
const Course = require('./Course')

const BootcampSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a name'],
			unique: true,
			trim: true,
			maxlength: [50, 'Name cannot be more than 50 characters'],
		},
		slug: String, // url friendly name for frontend integration
		description: {
			type: String,
			required: [true, 'Please add a description'],
			maxlength: [500, 'Description cannot be more than 500 characters'],
		},
		website: {
			type: String,
			validate(website) {
				if (!validator.isURL(website)) {
					console.error('Please use a valid URL with HTTP or HTTPS')
				}
			},
		},
		phone: {
			type: String,
			maxlength: [20, 'Phone number cannot be longer than 20 characters'],
		},
		email: {
			type: String,
			validate(email) {
				if (!validator.isEmail(email)) {
					console.error('Please add a valid email')
				}
			},
		},
		address: {
			type: String,
			required: [true, 'Please add a valid address'],
		},
		location: {
			// GeoJSON point
			type: {
				type: String, // Don't do `{ location: { type: String } }`
				enum: ['Point'], // 'location.type' must be 'Point'
				// required: true,
			},
			coordinates: {
				type: [Number], // an array of numbers
				// required: true,
				index: '2dsphere',
			},
			formattedAddress: String,
			street: String,
			city: String,
			state: String,
			zipcode: String,
			country: String,
		},
		careers: {
			// Array of strings
			type: [String],
			required: true,
			enum: [
				// allowed values
				'Mobile Development',
				'Web Development',
				'UI/UX',
				'Data Science',
				'Business',
				'Other',
			],
		},
		averageRating: {
			// will be generated, not provided
			type: Number,
			min: [1, 'Rating should be at least 1'],
			max: [10, 'Rating can not exceed 10'],
		},
		averageCost: Number,
		photo: {
			type: String, // this will store the name of the photo file
			default: 'no-photo.jpg',
		},
		housing: {
			// does the bootcamp provide housing
			type: Boolean,
			default: false,
		},
		jobAssistance: {
			type: Boolean,
			default: false,
		},
		jobGuarantee: {
			type: Boolean,
			default: false,
		},
		acceptGi: {
			type: Boolean,
			default: false,
		},
	},
	{
		// If you use toJSON() or toObject() mongoose will not include virtuals by default. This includes the output of calling JSON.stringify() on a Mongoose document, because JSON.stringify() calls toJSON(). Pass { virtuals: true } to either toObject() or toJSON().
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true,
	}
)

// Create bootcamp slug from the name
BootcampSchema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true })
	next()
})

// Geocode and create location field
BootcampSchema.pre('save', async function (next) {
	const loc = await geocoder.geocode(this.address)
	this.location = {
		type: 'Point',
		coordinates: [loc[0].longitude, loc[0].latitude],
		formattedAddress: loc[0].formattedAddress,
		state: loc[0].stateCode,
		street: loc[0].streetName,
		city: loc[0].city,
		zipcode: loc[0].zipcode,
		country: loc[0].countryCode,
	}

	// Do not store address in DB as we are storing it in formattedAddress
	this.address = undefined
	next()
})

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre('remove', async function (next) {
	console.log(`Courses being removed from bootcamp ${this._id}`)

	await Course.deleteMany({ bootcamp: this._id })
	next()
})

// Reverse populate with virtuals
// An array of courses for a bootcamp
BootcampSchema.virtual('courses', {
	ref: 'Course',
	localField: '_id',
	foreignField: 'bootcamp',
	justOne: false,
})

module.exports = mongoose.model('Bootcamp', BootcampSchema)
