// src/mongodb/models/Contact.js
const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        contacts: { type: Array },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Contact', contactSchema)
