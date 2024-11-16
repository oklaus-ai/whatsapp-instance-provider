const sessionRepository = require('../../mongodb/repositories/sessionRepository')

async function keyVerification(req, res, next) {
    const key = req.query['key']?.toString()

    if (!key) {
        return res
            .status(403)
            .json({ error: true, message: 'No key query was present' })
    }

    try {
        // Check if the session exists in the database
        const instance = await sessionRepository.findByKey(key)

        if (!instance) {
            return res
                .status(403)
                .json({ error: true, message: 'Invalid key supplied' })
        }

        // Attach the instance to the request for downstream use if needed
        req.instance = instance

        next()
    } catch (error) {
        console.error('Error verifying key:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Internal server error' })
    }
}

module.exports = keyVerification
