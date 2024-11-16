const InstanceManager = require('../class/InstanceManager')

exports.Text = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendTextMessage(req.body)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending text message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send text message' })
    }
}

exports.TextManager = async (instanceKey, message) => {
    const instance = InstanceManager.getInstance(instanceKey)

    if (!instance) {
        return { error: true, message: 'Instance not found' }
    }

    try {
        const data = await instance.sendTextMessage(message)
        return { error: false, data }
    } catch (error) {
        console.error('Error sending text message:', error)
        return { error: true, message: 'Failed to send text message' }
    }
}

exports.Image = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'image',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending image:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send image' })
    }
}

exports.sendurlfile = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMediaFile(req.body, 'url')
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending media from URL:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send media from URL' })
    }
}

exports.sendbase64file = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMediaFile(req.body, 'base64')
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending media from base64:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send media from base64' })
    }
}

exports.imageFile = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'image',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending image file:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send image file' })
    }
}

exports.audioFile = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'audio',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending audio file:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send audio file' })
    }
}

exports.Video = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'video',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending video:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send video' })
    }
}

exports.Audio = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'audio',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending audio:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send audio' })
    }
}

exports.Document = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMedia(
            req.body.id,
            req.body.userType,
            req.file,
            'document',
            req.body.caption,
            req.body.replyFrom,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending document:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send document' })
    }
}

exports.Mediaurl = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = {
            id: req.body.id,
            type: req.body.type, // 'image', 'video', 'audio', 'document'
            url: req.body.url,
            options: {
                caption: req.body.caption,
                mimetype: req.body.mimetype,
            },
        }

        const result = await instance.sendMediaFile(data, 'url')
        return res.status(201).json({ error: false, data: result })
    } catch (error) {
        console.error('Error sending media from URL:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send media from URL' })
    }
}

exports.Button = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendButtonMessage(
            req.body.id,
            req.body.btndata
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending button message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send button message' })
    }
}

exports.Contact = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendContactMessage(
            req.body.id,
            req.body.vcard
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending contact message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send contact message' })
    }
}

exports.List = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendListMessage(
            req.body.id,
            req.body.type,
            req.body.options,
            req.body.groupOptions,
            req.body.msgdata
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending list message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to send list message' })
    }
}

exports.MediaButton = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.sendMediaButtonMessage(
            req.body.id,
            req.body.btndata
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error sending media button message:', error)
        return res.status(500).json({
            error: true,
            message: 'Failed to send media button message',
        })
    }
}

exports.SetStatus = async (req, res) => {
    const presenceList = [
        'unavailable',
        'available',
        'composing',
        'recording',
        'paused',
    ]

    if (!presenceList.includes(req.body.status)) {
        return res.status(400).json({
            error: true,
            message:
                'Status parameter must be one of ' + presenceList.join(', '),
        })
    }

    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.setStatus(
            req.body.status,
            req.body.id,
            req.body.type,
            req.body.delay
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error setting status:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to set status' })
    }
}

exports.Read = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.readMessage(req.body.msg)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error reading message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to read message' })
    }
}

exports.React = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.reactMessage(
            req.body.id,
            req.body.key,
            req.body.emoji
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error reacting to message:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to react to message' })
    }
}
