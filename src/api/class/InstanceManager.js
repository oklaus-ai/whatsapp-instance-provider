// src/class/InstanceManager.js

const { WhatsAppInstance } = require('./instance')
const sessionRepository = require('../../mongodb/repositories/sessionRepository')
const AuthStateModel = require('../../mongodb/models/AuthState')
const ContactModel = require('../../mongodb/models/Contact')
const GroupModel = require('../../mongodb/models/Group')

class InstanceManager {
    constructor() {
        this.instances = {} // In-memory map of instances
    }

    async init() {
        // Restore instances from MongoDB on startup
        await this.restoreInstances()
    }

    async createInstance(key, options) {
        // Check if instance already exists
        if (this.instances[key]) {
            throw new Error('Instance already exists')
        }

        // Create a new session in MongoDB
        await sessionRepository.create({
            key,
            ...options,
        })

        // Initialize a new WhatsAppInstance
        const instance = new WhatsAppInstance(
            key,
            options.webhook,
            options.webhookUrl
        )
        await instance.init()

        // Store the instance in memory
        this.instances[key] = instance

        return instance
    }

    getInstance(key) {
        return this.instances[key] || null
    }

    async deleteInstance(key) {
        const instance = this.instances[key]
        if (instance) {
            await instance.deleteInstance(key)
            delete this.instances[key]
        } else {
            throw new Error('Instance not found')
        }
    }

    async restoreInstances() {
        const sessions = await sessionRepository.getAllSessions()
        for (const session of sessions) {
            const key = session.key
            if (!this.instances[key]) {
                const instance = new WhatsAppInstance(
                    key,
                    session.webhook,
                    session.webhookUrl
                )
                await instance.init()
                this.instances[key] = instance
            }
        }
    }

    async getAllInstances() {
        return Object.values(this.instances)
    }

    async getInstanceDetail(key) {
        const instance = this.instances[key]
        if (instance) {
            return await instance.getInstanceDetail(key)
        } else {
            // Retrieve from MongoDB if not in memory
            const sessionData = await sessionRepository.findByKey(key)
            if (sessionData) {
                return {
                    instance_key: key,
                    phone_connected: false,
                    browser: sessionData.browser || 'Minha Api',
                    webhook: sessionData.webhook || false,
                    base64: sessionData.base64 || false,
                    webhookUrl: sessionData.webhookUrl || '',
                    webhookEvents: sessionData.webhookEvents || [],
                    messagesRead: sessionData.messagesRead || false,
                    ignoreGroups: sessionData.ignoreGroups || false,
                    user: {},
                }
            } else {
                throw new Error('Instance not found')
            }
        }
    }
}

module.exports = new InstanceManager()
