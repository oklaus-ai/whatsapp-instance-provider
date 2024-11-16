// src/mongodb/repositories/sessionRepository.js

const Session = require('../models/Session')

const sessionRepository = {
    async findAll() {
        return await Session.find()
    },

    async findByKey(key) {
        return await Session.findOne({ key })
    },

    async create(sessionData) {
        const session = new Session(sessionData)
        return await session.save()
    },

    async update(key, updateData) {
        return await Session.findOneAndUpdate({ key }, updateData, {
            new: true,
        })
    },

    async delete(key) {
        return await Session.deleteOne({ key })
    },
    async deleteInactive() {
        return await Session.deleteMany({ phone_connected: { $ne: true } })
    },
    async getAllSessions() {
        return await Session.find({})
    },

    async countSessions() {
        return await Session.countDocuments({})
    },
    async deleteAll() {
        return await Session.deleteMany({})
    },
}

module.exports = sessionRepository
