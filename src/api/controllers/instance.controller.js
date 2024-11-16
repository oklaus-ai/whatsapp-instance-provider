// src/controllers/instance.controller.js

const path = require('path')
const config = require('../../config/config')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sessionRepository = require('../../mongodb/repositories/sessionRepository')
const InstanceManager = require('../class/InstanceManager')

exports.init = async (req, res) => {
    let {
        webhook = false,
        webhookUrl = false,
        browser = 'Minha Api',
        ignoreGroups = false,
        webhookEvents = [],
        messagesRead = false,
        base64 = false,
        key,
    } = req.body

    if (!key) {
        return res.json({
            error: true,
            message: 'Key is required to initialize an instance.',
        })
    }

    const existingSession = await sessionRepository.findByKey(key)

    const sessionCount = await sessionRepository.countSessions()

    if (process.env.MAX_INSTANCES) {
        const maxInstances = parseInt(process.env.MAX_INSTANCES, 10)
        if (maxInstances <= sessionCount) {
            return res.json({
                error: true,
                message: 'Maximum number of sessions reached.',
            })
        }
    }

    if (existingSession) {
        return res.json({
            error: true,
            message: 'Session already initialized.',
        })
    } else {
        const appUrl = config.appUrl || req.protocol + '://' + req.headers.host

        try {
            const instance = await InstanceManager.createInstance(key, {
                webhook,
                webhookUrl,
                browser,
                ignoreGroups,
                webhookEvents,
                messagesRead,
                base64,
            })

            res.json({
                error: false,
                message: 'Instance initialized',
                key: key,
                webhook: {
                    enabled: webhook,
                    webhookUrl: webhookUrl,
                    webhookEvents: webhookEvents,
                },
                qrcode: {
                    url: appUrl + '/instance/qr?key=' + key,
                },
                browser: browser,
                messagesRead: messagesRead,
                ignoreGroups: ignoreGroups,
            })
        } catch (error) {
            res.json({
                error: true,
                message: error.message,
            })
        }
    }
}

exports.editar = async (req, res) => {
    let {
        webhook = false,
        webhookUrl = false,
        browser = 'Minha Api',
        ignoreGroups = false,
        webhookEvents = [],
        messagesRead = false,
        base64 = false,
        key,
    } = req.body

    if (!key) {
        return res.json({
            error: true,
            message: 'Key is required to edit an instance.',
        })
    }

    const existingSession = await sessionRepository.findByKey(key)

    if (existingSession) {
        await sessionRepository.update(key, {
            ignoreGroups,
            webhook,
            base64,
            webhookUrl,
            browser,
            webhookEvents,
            messagesRead,
        })

        const instance = InstanceManager.getInstance(key)
        if (instance) {
            // Update instance properties
            instance.instance.webhook = webhook
            instance.instance.webhook_url = webhookUrl
            instance.instance.webhook_events = webhookEvents
            instance.instance.base64 = base64
            instance.instance.ignoreGroups = ignoreGroups
            instance.instance.mark = messagesRead
            instance.socketConfig.browser = [browser]

            // Re-initialize the instance to apply changes
            await instance.init()
        } else {
            await InstanceManager.createInstance(key, {
                webhook,
                webhookUrl,
                browser,
                ignoreGroups,
                webhookEvents,
                messagesRead,
                base64,
            })
        }

        res.json({
            error: false,
            message: 'Instance edited',
            key: key,
            webhook: {
                enabled: webhook,
                webhookUrl: webhookUrl,
                webhookEvents: webhookEvents,
            },
            browser: browser,
            messagesRead: messagesRead,
            ignoreGroups: ignoreGroups,
        })
    } else {
        return res.json({
            error: true,
            message: 'Session not found.',
        })
    }
}

exports.getcode = async (req, res) => {
    try {
        if (!req.body.number) {
            return res.json({
                error: true,
                message: 'Invalid phone number',
            })
        } else {
            const key = req.query.key
            const instance = InstanceManager.getInstance(key)
            if (!instance) {
                return res.json({
                    error: true,
                    message: 'Instance not found',
                })
            }

            const data = await instance.getInstanceDetail(key)

            if (data.phone_connected === true) {
                return res.json({
                    error: true,
                    message: 'Phone already connected',
                })
            } else {
                const number = await instance.getWhatsappCode(req.body.number)
                const code = await instance.instance.sock.requestPairingCode(
                    number
                )
                return res.json({
                    error: false,
                    code: code,
                })
            }
        }
    } catch (e) {
        console.error('Error getting pairing code:', e)
        return res.json({
            error: true,
            message: 'Error getting pairing code',
        })
    }
}

exports.ativas = async (req, res) => {
    if (req.query.active) {
        // Return list of active sessions from MongoDB
        const sessions = await sessionRepository.getAllSessions()
        const instanceKeys = sessions.map((session) => session.key)

        return res.json({
            data: instanceKeys,
        })
    }

    const instances = await InstanceManager.getAllInstances()
    const data = await Promise.all(
        instances.map((instance) => instance.getInstanceDetail(instance.key))
    )

    return res.json({
        data: data,
    })
}

exports.qr = async (req, res) => {
    const key = req.query.key
    const exists = await exports.validateInstance(req)
    if (exists === true) {
        const instance = InstanceManager.getInstance(key)
        let data
        try {
            data = await instance.getInstanceDetail(key)
        } catch (error) {
            data = {}
        }
        if (data.phone_connected === true) {
            return res.json({
                error: true,
                message: 'Phone already connected',
            })
        } else {
            try {
                const qrcode = instance.instance.qr
                res.render('qrcode', {
                    qrcode: qrcode,
                })
            } catch {
                res.json({
                    qrcode: '',
                })
            }
        }
    } else {
        return res.json({
            error: true,
            message: 'Instance does not exist',
        })
    }
}

exports.qrbase64 = async (req, res) => {
    const key = req.query.key
    const exists = await exports.validateInstance(req)
    if (exists === true) {
        const instance = InstanceManager.getInstance(key)
        let data
        try {
            data = await instance.getInstanceDetail(key)
        } catch (error) {
            data = {}
        }
        if (data.phone_connected === true) {
            return res.json({
                error: true,
                message: 'Phone already connected',
            })
        } else {
            try {
                const qrcode = instance.instance.qr
                res.json({
                    error: false,
                    message: 'QR Base64 fetched successfully',
                    qrcode: qrcode,
                })
            } catch {
                res.json({
                    qrcode: '',
                })
            }
        }
    } else {
        return res.json({
            error: true,
            message: 'Instance does not exist',
        })
    }
}

exports.validateInstance = async (req) => {
    const key = req.query.key
    const existingSession = await sessionRepository.findByKey(key)
    if (existingSession) {
        return true
    } else {
        return false
    }
}

exports.info = async (req, res) => {
    const key = req.query.key
    const exists = await exports.validateInstance(req)
    if (exists === true) {
        try {
            const data = await InstanceManager.getInstanceDetail(key)
            return res.json({
                error: false,
                message: 'Instance fetched successfully',
                instance_data: data,
            })
        } catch (error) {
            return res.json({
                error: true,
                message: error.message,
            })
        }
    } else {
        return res.json({
            error: true,
            message: 'Instance does not exist',
        })
    }
}

exports.infoManager = async (key) => {
    try {
        const instance = InstanceManager.getInstance(key)
        if (instance) {
            const data = await instance.getInstanceDetail(key)
            return data
        } else {
            // Try to get details from MongoDB
            const data = await InstanceManager.getInstanceDetail(key)
            return data
        }
    } catch (error) {
        return {
            error: true,
            message: 'Error finding the instance, please try again',
        }
    }
}

exports.restore = async (req, res, next) => {
    try {
        await InstanceManager.restoreInstances()
        const instances = await InstanceManager.getAllInstances()
        const data = await Promise.all(
            instances.map((instance) =>
                instance.getInstanceDetail(instance.key)
            )
        )

        return res.json({
            error: false,
            message: 'All instances restored',
            data: data,
        })
    } catch (error) {
        next(error)
    }
}

exports.logout = async (req, res) => {
    const key = req.query.key
    try {
        const instance = InstanceManager.getInstance(key)
        if (instance) {
            await instance.instance.sock.logout()
            await InstanceManager.deleteInstance(key)
            // Optionally, you can re-initialize the instance
            // await InstanceManager.createInstance(key, {});
        } else {
            throw new Error('Instance not found')
        }
        return res.json({
            error: false,
            message: 'Logout successful',
        })
    } catch (error) {
        return res.json({
            error: true,
            message: error.message,
        })
    }
}

exports.delete = async (req, res) => {
    const key = req.query.key
    try {
        const exists = await exports.validateInstance(req)
        if (exists === true) {
            await InstanceManager.deleteInstance(key)
            return res.json({
                error: false,
                message: 'Instance deleted successfully',
            })
        } else {
            return res.json({
                error: true,
                message: 'Instance does not exist',
            })
        }
    } catch (error) {
        return res.json({
            error: true,
            message: error.message,
        })
    }
}

exports.list = async (req, res) => {
    try {
        const instances = await InstanceManager.getAllInstances()
        const data = await Promise.all(
            instances.map((instance) =>
                instance.getInstanceDetail(instance.key)
            )
        )
        return res.json({
            error: false,
            message: 'All instances listed',
            data: data,
        })
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        })
    }
}

exports.deleteInactives = async (req, res) => {
    try {
        const instances = await InstanceManager.getAllInstances()
        const data = await Promise.all(
            instances.map((instance) =>
                instance.getInstanceDetail(instance.key)
            )
        )
        for (const instanceData of data) {
            if (
                instanceData.phone_connected === undefined ||
                instanceData.phone_connected === false
            ) {
                await InstanceManager.deleteInstance(instanceData.instance_key)
                await sleep(150)
            }
        }
        return res.json({
            error: false,
            message: 'All inactive sessions deleted',
        })
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        })
    }
}

exports.deleteAll = async (req, res) => {
    try {
        const instances = await InstanceManager.getAllInstances()
        for (const instance of instances) {
            await InstanceManager.deleteInstance(instance.key)
            await sleep(150)
        }
        return res.json({
            error: false,
            message: 'All sessions deleted',
        })
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        })
    }
}
