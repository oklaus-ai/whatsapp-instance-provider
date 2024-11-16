const dotenv = require('dotenv')
const logger = require('pino')()
dotenv.config()

const app = require('./config/express')
const config = require('./config/config')
const { Session } = require('./api/class/session')
const { connectToMongoDB, disconnectFromMongoDB } = require('./config/mongoose')

let server

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectToMongoDB()

        // Start the server
        server = app.listen(config.port, async () => {
            logger.info(`Listening on port ${config.port}`)

            // Restore sessions if configured
            if (config.restoreSessionsOnStartup) {
                logger.info(`Restoring sessions...`)
                const session = new Session()
                await session.restoreSessions()
                logger.info(`Sessions restored successfully.`)
            }
        })
    } catch (error) {
        logger.error('Error starting server:', error)
        process.exit(1)
    }
}

// Graceful shutdown
const exitHandler = async () => {
    try {
        if (server) {
            server.close(() => {
                logger.info('Server closed')
            })
        }
        // Disconnect from MongoDB
        await disconnectFromMongoDB()
        process.exit(0)
    } catch (error) {
        logger.error('Error during shutdown:', error)
        process.exit(1)
    }
}

// Handle uncaught errors
const unexpectedErrorHandler = (error) => {
    logger.error(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM received')
    if (server) {
        server.close()
    }
})

// Start the server immediately
startServer()

module.exports = server
