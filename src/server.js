const dotenv = require('dotenv')
const pino = require('pino')
const logger = pino()
dotenv.config()

const app = require('./config/express')
const config = require('./config/config')
const { connectDB } = require('./mongodb')
const InstanceManager = require('./api/class/InstanceManager')

let server

    // Connect to MongoDB
;(async () => {
    try {
        await connectDB()
        logger.info('Connected to MongoDB')

        // Initialize the InstanceManager and restore instances
        await InstanceManager.init()
        logger.info('InstanceManager initialized')

        if (config.restoreSessionsOnStartup) {
            logger.info('Restoring WhatsApp instances...')
            await InstanceManager.restoreInstances()
            logger.info('WhatsApp instances restored successfully')
        }

        // Start the server
        server = app.listen(config.port, () => {
            logger.info(`Listening on port ${config.port}`)
        })
    } catch (error) {
        logger.error('Failed to initialize the application:', error)
        process.exit(1) // Exit if any critical error occurs during startup
    }
})()

// Gracefully handle application exit
const exitHandler = () => {
    if (server) {
        server.close(async () => {
            logger.info('Server closed')
            try {
                await InstanceManager.cleanup() // Cleanup instances gracefully
                logger.info('Instances cleaned up')
            } catch (cleanupError) {
                logger.error('Error during instance cleanup:', cleanupError)
            }
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

// Error handling for unexpected errors
const unexpectedErrorHandler = (error) => {
    logger.error('Unexpected error:', error)
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

module.exports = server
