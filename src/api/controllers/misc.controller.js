const InstanceManager = require('../class/InstanceManager')

exports.onWhatsapp = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.verifyId(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error verifying WhatsApp ID:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to verify WhatsApp ID' })
    }
}

exports.downProfile = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.DownloadProfile(req.body.id, req.body.group)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error downloading profile:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to download profile' })
    }
}

exports.getStatus = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.getUserStatus(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error getting user status:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to get user status' })
    }
}

exports.contacts = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.contacts()
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error fetching contacts:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to fetch contacts' })
    }
}

exports.mystatus = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.mystatus(req.body.status)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating status:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to update status' })
    }
}

exports.chats = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.chats(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error fetching chats:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to fetch chats' })
    }
}

exports.blockUser = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.blockUnblock(
            req.body.id,
            req.body.block_status
        )
        const message =
            req.body.block_status === 'block'
                ? 'Contact Blocked'
                : 'Contact Unblocked'
        return res.status(201).json({ error: false, message })
    } catch (error) {
        console.error('Error blocking/unblocking user:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to block/unblock user' })
    }
}

exports.updateProfilePicture = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.updateProfilePicture(
            req.body.id,
            req.body.url,
            req.body.type
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating profile picture:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to update profile picture' })
    }
}

exports.updateProfilePictureManager = async (instanceKey, id, url, type) => {
    const instance = InstanceManager.getInstance(instanceKey)

    if (!instance) {
        return { error: true, message: 'Instance not found' }
    }

    try {
        const data = await instance.updateProfilePicture(id, url, type)
        return { error: false, data }
    } catch (error) {
        console.error('Error updating profile picture:', error)
        return { error: true, message: 'Failed to update profile picture' }
    }
}

exports.getUserOrGroupById = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.getUserOrGroupById(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error fetching user/group by ID:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to fetch user/group by ID' })
    }
}
