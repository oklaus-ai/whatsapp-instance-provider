// src/class/session.js
const { WhatsAppInstance } = require('./instance')
const sessionRepository = require('../../mongodb/repositories/sessionRepository')
const logger = require('pino')()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class Session {
    async restoreSessions() {
        const restoredSessions = []
        try {
            const allSessions = await sessionRepository.findAll()

            for (const sessionData of allSessions) {
                const { key, webhook, webhookUrl } = sessionData
                const instance = new WhatsAppInstance(key, webhook, webhookUrl)
                await instance.init()
                WhatsAppInstances[key] = instance
                restoredSessions.push(key)
                await sleep(150)
            }
        } catch (e) {
            logger.error('Error restoring sessions')
            logger.error(e)
        }

        return restoredSessions
    }
}

exports.Session = Session
