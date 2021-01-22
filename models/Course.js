const mongoose = require('mongoose')
const Bootcamp = require('./Bootcamp')

const CourseSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			required: [true, 'Please add a course title'],
		},
		description: {
			type: String,
			required: [true, 'Please add a description'],
		},
		weeks: {
			type: String,
			required: [true, 'Please add number of weeks'],
		},
		tuition: {
			type: Number,
			required: [true, 'Please add a tuition cost'],
		},
		minimumSkill: {
			type: String,
			required: [true, 'Please add a minimum skill'],
			enum: ['beginner', 'intermediate', 'advanced'],
		},
		scholarshipAvailable: {
			type: Boolean,
			default: false,
		},
		bootcamp: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Bootcamp',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

// Static method to get avg of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
	const obj = await this.aggregate([
		{
			$match: { bootcamp: bootcampId },
		},
		{
			$group: {
				_id: '$bootcamp',
				averageCost: { $avg: '$tuition' },
			},
		},
	])

	try {
		await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
			averageCost: Math.ceil(obj[0].averageCost),
		})
	} catch (err) {
		console.error(err)
	}
}

// Call getAverageCost after save
CourseSchema.post('save', async function (course, next) {
	await this.constructor.getAverageCost(this.bootcamp)
	next()
})

// Call getAverageCost after remove
CourseSchema.post('remove', async function (course, next) {
	await this.constructor.getAverageCost(this.bootcamp)
	next()
})

module.exports = mongoose.model('Course', CourseSchema)

/*
Note: If you specify schema.pre('remove'), Mongoose will register this middleware for doc.remove() by default. If you want to your middleware to run on Query.remove() use schema.pre('remove', { query: true, document: false }, fn).

Note: Unlike schema.pre('remove'), Mongoose registers updateOne and deleteOne middleware on Query#updateOne() and Query#deleteOne() by default. This means that both doc.updateOne() and Model.updateOne() trigger updateOne hooks, but this refers to a query, not a document. To register updateOne or deleteOne middleware as document middleware, use schema.pre('updateOne', { document: true, query: false }).

Note: The create() function fires save() hooks.
*/
