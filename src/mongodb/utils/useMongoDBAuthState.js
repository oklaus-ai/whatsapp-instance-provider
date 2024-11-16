// src/mongodb/utils/useMongoDBAuthState.js
const AuthStateModel = require('../models/AuthState')
const { initAuthCreds } = require('@whiskeysockets/baileys')

async function useMongoDBAuthState(key) {
    let authStateDoc = await AuthStateModel.findOne({ key })

    let creds = authStateDoc?.creds || initAuthCreds()
    let keys = authStateDoc?.keys || {}

    const saveCreds = async () => {
        await AuthStateModel.findOneAndUpdate(
            { key },
            { creds, keys },
            { upsert: true }
        )
    }

    const state = {
        creds,
        keys: {
            get: async (type, ids) => {
                const data = {}
                for (const id of ids) {
                    data[id] = keys[type]?.[id]
                }
                return data
            },
            set: async (data) => {
                for (const category in data) {
                    keys[category] = keys[category] || {}
                    Object.assign(keys[category], data[category])
                }
                await saveCreds()
            },
        },
    }

    return { state, saveCreds }
}

module.exports = useMongoDBAuthState
