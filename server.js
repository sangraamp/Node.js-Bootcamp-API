const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan') // dev logging
const colors = require('colors')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')

// Load env vars
dotenv.config({ path: './config/config.env' })

connectDB()

// Route files
const bootcampsRouter = require('./routes/bootcamps')

const app = express()

// Parse incoming requests
app.use(express.json())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.use('/api/v1/bootcamps', bootcampsRouter)

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
