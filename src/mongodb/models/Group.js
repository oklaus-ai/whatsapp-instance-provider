// src/mongodb/models/Group.js
const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        groups: { type: Object },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Group', groupSchema)
