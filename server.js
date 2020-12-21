const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')

// Route files
const bootcampsRouter = require('./routes/bootcamps')

// load env vars
dotenv.config({ path: './config/config.env' })

const app = express()

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.use('/api/v1/bootcamps', bootcampsRouter)

const PORT = process.env.PORT || 5000

app.listen(
	PORT,
	console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}.`)
)
