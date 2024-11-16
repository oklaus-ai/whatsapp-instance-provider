// src/mongodb/models/AuthState.js
const mongoose = require('mongoose')

const authStateSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        creds: { type: Object },
        keys: { type: Object },
    },
    { timestamps: true }
)

module.exports = mongoose.model('AuthState', authStateSchema)
