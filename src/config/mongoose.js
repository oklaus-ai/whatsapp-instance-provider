const mongoose = require('mongoose')

const mongoUrl = process.env.MONGODB_URL

const connectToMongoDB = async () => {
    try {
        // Simply pass the URL without deprecated options
        await mongoose.connect(mongoUrl)
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message)
        process.exit(1) // Exit if MongoDB connection fails
    }
}

const disconnectFromMongoDB = async () => {
    try {
        await mongoose.connection.close()
        console.log('Disconnected from MongoDB')
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error.message)
    }
}

module.exports = { connectToMongoDB, disconnectFromMongoDB }
