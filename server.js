const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan') // dev logging
const colors = require('colors')
const fileupload = require('express-fileupload')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')

// Load env vars
dotenv.config({ path: './config/config.env' })

connectDB()

// Route files
const bootcampsRouter = require('./routes/bootcamps')
const coursesRouter = require('./routes/courses')

const app = express()

// Parse incoming requests
app.use(express.json())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// File uploading
app.use(fileupload())

app.use('/api/v1/bootcamps', bootcampsRouter)
app.use('/api/v1/courses', coursesRouter)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
	PORT,
	console.log(
		`Server running in ${process.env.NODE_ENV} mode on port ${PORT}.`.yellow
			.bold
	)
)

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`.red)

	// Close the server and exit process
	server.close(() => process.exit(1))
})
