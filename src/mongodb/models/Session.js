const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        webhook: { type: Boolean, default: false },
        webhookUrl: { type: String, default: '' },
        ignoreGroups: { type: Boolean, default: false },
        webhookEvents: { type: [String], default: [] },
        messagesRead: { type: Boolean, default: false },
        base64: { type: Boolean, default: false },
        browser: { type: String, default: 'Minha Api' },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Session', sessionSchema)
