const InstanceManager = require('../class/InstanceManager')

exports.create = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.createNewGroup(
            req.body.name,
            req.body.users
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error creating new group:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to create new group' })
    }
}

exports.addNewParticipant = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.addNewParticipant(
            req.body.id,
            req.body.users
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error adding new participant:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to add new participant' })
    }
}

exports.removeuser = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.removeuser(req.body.id, req.body.users)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error removing user:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to remove user' })
    }
}

exports.makeAdmin = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.makeAdmin(req.body.id, req.body.users)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error making user admin:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to make user admin' })
    }
}

exports.demoteAdmin = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.demoteAdmin(req.body.id, req.body.users)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error demoting user admin:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to demote user admin' })
    }
}

exports.listAll = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.getAllGroups()
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error listing all groups:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to list all groups' })
    }
}

exports.leaveGroup = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.leaveGroup(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error leaving group:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to leave group' })
    }
}

exports.join = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.joinURL(req.body.url)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error joining group via URL:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to join group via URL' })
    }
}

exports.getInviteCodeGroup = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.getInviteCodeGroup(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error getting invite code for group:', error)
        return res.status(500).json({
            error: true,
            message: 'Failed to get invite code for group',
        })
    }
}

exports.getInstanceInviteCodeGroup = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.getInstanceInviteCodeGroup(req.body.id)
        return res
            .status(201)
            .json({ error: false, link: 'https://chat.whatsapp.com/' + data })
    } catch (error) {
        console.error('Error getting instance invite code group:', error)
        return res.status(500).json({
            error: true,
            message: 'Failed to get instance invite code group',
        })
    }
}

exports.getAllGroups = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupFetchAllParticipating()
        return res.json({ error: false, message: 'Groups found', data })
    } catch (error) {
        console.error('Error getting all groups:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to get all groups' })
    }
}

exports.groupParticipantsUpdate = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupParticipantsUpdate(
            req.body.id,
            req.body.users,
            req.body.action
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating group participants:', error)
        return res.status(500).json({
            error: true,
            message: 'Failed to update group participants',
        })
    }
}

exports.groupSettingUpdate = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupSettingUpdate(
            req.body.id,
            req.body.action
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating group settings:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to update group settings' })
    }
}

exports.groupUpdateSubject = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupUpdateSubject(
            req.body.id,
            req.body.subject
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating group subject:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to update group subject' })
    }
}

exports.groupUpdateDescription = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupUpdateDescription(
            req.body.id,
            req.body.description
        )
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error updating group description:', error)
        return res.status(500).json({
            error: true,
            message: 'Failed to update group description',
        })
    }
}

exports.groupInviteInfo = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupGetInviteInfo(req.body.url)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error getting group invite info:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to get group invite info' })
    }
}

exports.groupidinfo = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupidinfo(req.body.id)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error getting group ID info:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to get group ID info' })
    }
}

exports.groupJoin = async (req, res) => {
    const key = req.query.key
    const instance = InstanceManager.getInstance(key)

    if (!instance) {
        return res
            .status(404)
            .json({ error: true, message: 'Instance not found' })
    }

    try {
        const data = await instance.groupAcceptInvite(req.body.code)
        return res.status(201).json({ error: false, data })
    } catch (error) {
        console.error('Error joining group:', error)
        return res
            .status(500)
            .json({ error: true, message: 'Failed to join group' })
    }
}
