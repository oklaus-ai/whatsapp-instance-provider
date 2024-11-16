const sessionRepository = require('../../mongodb/repositories/sessionRepository')
const { WhatsAppInstance } = require('../class/instance')

async function loginVerification(req, res, next) {
    const key = req.query['key']?.toString()

    if (!key) {
        return res
            .status(403)
            .json({ error: true, message: 'No key query was present' })
    }

    try {
        // Check if the session exists in the database
        const session = await sessionRepository.findByKey(key)

        if (!session) {
            return res
                .status(403)
                .json({ error: true, message: 'Invalid key supplied' })
        }

        // Rehydrate the WhatsApp instance using the session key
        const instance = new WhatsAppInstance(key)
        await instance.init()

        if (!instance.instance?.online) {
            return res
                .status(401)
                .json({ error: true, message: "Phone isn't connected" })
        }

        // Attach the instance to the request for downstream use if needed
        req.instance = instance

        next()
    } catch (error) {
        console.error('Error verifying login status:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Internal server error' })
    }
}

module.exports = loginVerification
