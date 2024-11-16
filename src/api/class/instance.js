// src/class/instance.js

const ffmpegPath = require('@ffmpeg-installer/ffmpeg')
const { exec } = require('child_process')
const fetch = require('node-fetch')
const QRCode = require('qrcode')
const pino = require('pino')
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 86400 })
const GroupsCache = new NodeCache({ stdTTL: 20 })
const GroupsMetaDados = new NodeCache({ stdTTL: 3600 })
const asyncLib = require('async')
const path = require('path')
const processButton = require('../helper/processbtn')
const generateVC = require('../helper/genVc')
const axios = require('axios')
const config = require('../../config/config')
const downloadMessage = require('../helper/downloadMsg')
const fs = require('fs').promises
const getMIMEType = require('mime-types')
const url = require('url')
const { v4: uuidv4 } = require('uuid')
const {
    makeWASocket,
    DisconnectReason,
    isJidUser,
    isJidGroup,
    jidDecode,
    jidEncode,
    isLid,
    isJidBroadcast,
    makeInMemoryStore,
    proto,
    delay,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    generateWAMessageFromContent,
    initAuthCreds,
    BufferJSON,
} = require('@whiskeysockets/baileys')
const useMongoDBAuthState = require('../../mongodb/utils/useMongoDBAuthState')
const sessionRepository = require('../../mongodb/repositories/sessionRepository')
const AuthStateModel = require('../../mongodb/models/AuthState')
const ContactModel = require('../../mongodb/models/Contact')
const GroupModel = require('../../mongodb/models/Group')
const logger = pino({ level: config.log.level || 'info' })

class WhatsAppInstance {
    socketConfig = {
        defaultQueryTimeoutMs: undefined,
        printQRInTerminal: false,
        logger: logger,
        msgRetryCounterCache: cache,
        getMessage: async (key) => {
            // Implement message retrieval if necessary
            return {}
        },
        patchMessageBeforeSending: (msg) => {
            // Handle any message patches if necessary
            return msg
        },
    }

    key = ''
    authState
    allowWebhook = undefined
    webhook = undefined
    instance = {
        key: this.key,
        chats: [],
        contacts: [],
        qr: '',
        messages: [],
        qrRetry: 0,
        customWebhook: '',
        WAPresence: [],
        deleted: false,
    }

    axiosInstance = axios.create({
        baseURL: config.webhookUrl,
    })

    constructor(key, allowWebhook, webhook) {
        this.key = key ? key : uuidv4()
        this.instance.customWebhook = webhook
        this.allowWebhook = config.webhookEnabled
            ? config.webhookEnabled
            : allowWebhook

        if (this.allowWebhook && this.instance.customWebhook) {
            this.axiosInstance = axios.create({
                baseURL: this.instance.customWebhook,
            })
        }

        this.queue = this.createQueue(257)
    }

    createQueue() {
        return asyncLib.queue(async (task, callback) => {
            try {
                await this.assertSession(task.lid)
                callback()
            } catch (error) {
                console.error(`Error processing ${task.lid}:`, error)
                callback(error)
            }
        }, 1)
    }

    // Media processing methods (e.g., geraThumb, thumbURL, etc.)
    // Implement your media processing methods here as needed

    async geraThumb(videoPath) {
        const name = uuidv4()
        const tempDir = 'temp'
        const thumbPath = `temp/${name}thumb.png`
        const base64Regex =
            /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
        const base64 = base64Regex.test(videoPath)

        try {
            let videoBuffer
            let videoTempPath

            if (videoPath.startsWith('http')) {
                const response = await axios.get(videoPath, {
                    responseType: 'arraybuffer',
                })
                videoTempPath = path.join(tempDir, `${name}.mp4`)
                videoBuffer = Buffer.from(response.data)
                await fs.writeFile(videoTempPath, videoBuffer)
            } else if (base64 === true) {
                videoTempPath = path.join(tempDir, `temp/${name}.mp4`)
                const buffer = Buffer.from(videoPath, 'base64')
                await fs.writeFile(videoTempPath, buffer)
            } else {
                videoTempPath = videoPath
            }

            const command = `${ffmpegPath.path} -i ${videoTempPath} -ss 00:00:01 -vframes 1 ${thumbPath}`

            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })

            const thumbContent = await fs.readFile(thumbPath, {
                encoding: 'base64',
            })

            await Promise.all([fs.unlink(videoTempPath), fs.unlink(thumbPath)])

            return thumbContent
        } catch (error) {
            console.log(error)
        }
    }

    async thumbURL(url) {
        const videoUrl = url
        try {
            const thumbContentFromUrl = await this.geraThumb(videoUrl)
            return thumbContentFromUrl
        } catch (error) {
            console.log(error)
        }
    }

    async thumbBUFFER(buffer) {
        try {
            const thumbContentFromBuffer = await this.geraThumb(buffer)
            return thumbContentFromBuffer
        } catch (error) {
            console.log(error)
        }
    }

    async thumbBase64(buffer) {
        try {
            const thumbContentFromBuffer = await this.geraThumb(buffer)
            return thumbContentFromBuffer
        } catch (error) {
            console.log(error)
        }
    }

    async convertMP3(audioSource) {
        try {
            const return_mp3 = await this.mp3(audioSource)
            return return_mp3
        } catch (error) {
            console.log(error)
        }
    }

    async mp3(audioSource) {
        const name = uuidv4()
        try {
            const mp3_temp = `temp/${name}.mp3`
            const command = `${ffmpegPath.path} -i ${audioSource} -acodec libmp3lame -ab 128k ${mp3_temp}`

            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })

            const audioContent = await fs.readFile(mp3_temp, {
                encoding: 'base64',
            })

            await Promise.all([fs.unlink(mp3_temp), fs.unlink(audioSource)])

            return audioContent
        } catch (error) {
            console.log(error)
        }
    }

    async convertToMP4(audioSource) {
        const name = uuidv4()
        try {
            let audioBuffer

            if (Buffer.isBuffer(audioSource)) {
                audioBuffer = audioSource
            } else if (audioSource.startsWith('http')) {
                const response = await fetch(audioSource)
                audioBuffer = await response.buffer()
            } else if (audioSource.startsWith('data:audio')) {
                const base64DataIndex = audioSource.indexOf(',')
                if (base64DataIndex !== -1) {
                    const base64Data = audioSource.slice(base64DataIndex + 1)
                    audioBuffer = Buffer.from(base64Data, 'base64')
                }
            } else {
                audioBuffer = audioSource
            }

            const tempOutputFile = `temp/temp_output_${name}.opus`
            const mp3_temp = `temp/${name}.mp3`
            const ffmpegCommand = `${ffmpegPath.path} -i "${mp3_temp}" -c:a libopus -b:a 128k -ac 1 "${tempOutputFile}"`

            await fs.writeFile(mp3_temp, Buffer.from(audioBuffer))

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })

            fs.unlink(mp3_temp)
            return tempOutputFile
        } catch (error) {
            throw error
        }
    }

    async convertTovideoMP4(videoSource) {
        const name = uuidv4()
        try {
            let videoBuffer

            if (Buffer.isBuffer(videoSource)) {
                videoBuffer = videoSource
            } else if (videoSource.startsWith('http')) {
                const response = await fetch(videoSource)
                videoBuffer = await response.buffer()
            } else if (videoSource.startsWith('data:video')) {
                const base64DataIndex = videoSource.indexOf(',')
                if (base64DataIndex !== -1) {
                    const base64Data = videoSource.slice(base64DataIndex + 1)
                    videoBuffer = Buffer.from(base64Data, 'base64')
                }
            } else {
                videoBuffer = videoSource
            }

            const tempOutputFile = `temp/temp_output_${name}.mp4`
            const mp4 = `temp/${name}.mp4`
            const ffmpegCommand = `${ffmpegPath.path} -i "${mp4}" -c:v libx264 -c:a aac -strict experimental -b:a 192k -movflags faststart -f mp4 "${tempOutputFile}"`

            await fs.writeFile(mp4, Buffer.from(videoBuffer))

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })

            fs.unlink(mp4)
            return tempOutputFile
        } catch (error) {
            throw error
        }
    }

    // Database methods
    async dataBase() {
        try {
            const { state, saveCreds } = await useMongoDBAuthState(this.key)
            return { state, saveCreds }
        } catch (error) {
            console.error(
                'Failed to initialize auth state from database',
                error
            )
        }
    }

    async SendWebhook(type, hook, body, key) {
        if (!this.allowWebhook || !this.instance.customWebhook) {
            return
        }

        const events = this.instance.webhook_events || []
        if (!events.includes(hook)) {
            return
        }

        try {
            await this.axiosInstance.post('', {
                type,
                body,
                instanceKey: key,
            })
        } catch (error) {
            console.error('Error sending webhook:', error)
        }
    }

    async init() {
        console.log('Initializing WhatsApp instance with key:', this.key)

        const sessionData = await sessionRepository.findByKey(this.key)
        if (!sessionData) {
            console.error(`Session data not found for key: ${this.key}`)
            return
        }

        const { state, saveCreds } = await this.dataBase()

        this.authState = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
            saveCreds: saveCreds,
        }

        this.socketConfig.auth = this.authState

        let browserInfo = {
            platform: sessionData.browser || 'Chrome (Linux)',
            browser: 'Chrome',
            version: '22.5.0',
        }

        this.instance.mark = sessionData.messagesRead
        this.instance.webhook = sessionData.webhook
        this.instance.webhook_url = sessionData.webhookUrl
        this.instance.webhook_events = sessionData.webhookEvents
        this.instance.base64 = sessionData.base64
        this.instance.ignoreGroups = sessionData.ignoreGroups

        if (this.instance.ignoreGroups === true) {
            this.socketConfig.shouldIgnoreJid = (jid) => {
                const isGroupJid = isJidGroup(jid)
                const isBroadcast = isJidBroadcast(jid)
                const isNewsletter = jid.includes('newsletter')
                return isGroupJid || isBroadcast || isNewsletter
            }
        } else {
            this.socketConfig.shouldIgnoreJid = (jid) => {
                const isNewsletter = jid.includes('newsletter')
                const isBroadcast = isJidBroadcast(jid)
                return isBroadcast || isNewsletter
            }
        }

        this.socketConfig.browser = [
            browserInfo.platform,
            browserInfo.browser,
            browserInfo.version,
        ]
        this.socketConfig.emitOwnEvents = true

        this.instance.sock = makeWASocket(this.socketConfig)

        this.setHandler()

        return this
    }

    setHandler() {
        const sock = this.instance.sock

        sock.ev.on('creds.update', async (creds) => {
            await this.authState.saveCreds()
        })

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            const statusCode =
                lastDisconnect?.error?.output?.statusCode ||
                lastDisconnect?.error?.output?.payload?.statusCode

            if (connection === 'close') {
                if (
                    statusCode === DisconnectReason.loggedOut ||
                    statusCode === DisconnectReason.badSession ||
                    statusCode === DisconnectReason.restartRequired
                ) {
                    console.log('Connection closed. Reinitializing...')
                    await delay(1000)
                    this.instance.online = false
                    await this.init()
                } else {
                    console.error(
                        'Connection closed due to unknown reason. Reinitializing...'
                    )
                    await this.init()
                }

                await this.SendWebhook(
                    'connection',
                    'connection.update',
                    {
                        connection: connection,
                        connection_code: statusCode,
                    },
                    this.key
                )
            } else if (connection === 'open') {
                console.log('Connection opened successfully!')
                this.instance.online = true

                await this.SendWebhook(
                    'connection',
                    'connection.update',
                    {
                        connection: connection,
                    },
                    this.key
                )
            }

            if (qr) {
                QRCode.toDataURL(qr).then((url) => {
                    this.instance.qr = url
                })

                await this.SendWebhook(
                    'qrCode',
                    'qrCode.update',
                    {
                        qr: qr,
                    },
                    this.key
                )
            }
        })

        // Event handlers for presence updates
        sock.ev.on('presence.update', async (json) => {
            await this.SendWebhook(
                'presence',
                'presence.update',
                json,
                this.key
            )
        })

        // Event handlers for contacts
        sock.ev.on('contacts.upsert', async (contacts) => {
            try {
                const existingContact = await ContactModel.findOne({
                    key: this.key,
                })
                if (existingContact) {
                    // Update existing contacts
                    const updatedContacts = existingContact.contacts || []
                    contacts.forEach((contact) => {
                        const index = updatedContacts.findIndex(
                            (c) => c.id === contact.id
                        )
                        if (index !== -1) {
                            updatedContacts[index] = contact
                        } else {
                            updatedContacts.push(contact)
                        }
                    })
                    existingContact.contacts = updatedContacts
                    await existingContact.save()
                } else {
                    // Create new contact document
                    const newContact = new ContactModel({
                        key: this.key,
                        contacts: contacts,
                    })
                    await newContact.save()
                }
                await this.SendWebhook(
                    'contacts',
                    'contacts.upsert',
                    contacts,
                    this.key
                )
            } catch (error) {
                console.log('Error updating contacts in MongoDB', error)
            }
        })

        // Event handlers for chats
        sock.ev.on('chats.upsert', async (newChat) => {
            try {
                await this.SendWebhook(
                    'chats',
                    'chats.upsert',
                    newChat,
                    this.key
                )
            } catch (e) {
                return
            }
        })

        sock.ev.on('chats.delete', async (deletedChats) => {
            try {
                await this.SendWebhook(
                    'chats',
                    'chats.delete',
                    deletedChats,
                    this.key
                )
            } catch (e) {
                return
            }
        })

        sock.ev.on('messages.update', async (m) => {
            try {
                await this.SendWebhook(
                    'updateMessage',
                    'messages.update',
                    m,
                    this.key
                )
            } catch (e) {
                return
            }
        })

        // On new message
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'prepend')
                this.instance.messages.unshift(...m.messages)
            if (m.type !== 'notify') return
            this.instance.messages.unshift(...m.messages)
            m.messages.map(async (msg) => {
                if (!msg.message) return
                if (this.instance.mark === true) {
                    try {
                        await this.lerMensagem(msg.key.id, msg.key.remoteJid)
                    } catch (e) {
                        console.error('Error marking message as read:', e)
                    }
                }
                const messageType = Object.keys(msg.message)[0]
                if (
                    [
                        'protocolMessage',
                        'senderKeyDistributionMessage',
                    ].includes(messageType)
                )
                    return
                if (this.instance.webhook === true) {
                    try {
                        const webhookData = {
                            key: this.key,
                            ...msg,
                        }
                        if (messageType === 'conversation') {
                            webhookData['text'] = msg.message.conversation
                        }
                        if (this.instance.base64 === true) {
                            switch (messageType) {
                                case 'imageMessage':
                                    webhookData['msgContent'] =
                                        await downloadMessage(
                                            msg.message.imageMessage,
                                            'image'
                                        )
                                    break
                                case 'videoMessage':
                                    webhookData['msgContent'] =
                                        await downloadMessage(
                                            msg.message.videoMessage,
                                            'video'
                                        )
                                    break
                                case 'audioMessage':
                                    webhookData['msgContent'] =
                                        await downloadMessage(
                                            msg.message.audioMessage,
                                            'audio'
                                        )
                                    break
                                case 'documentMessage':
                                    webhookData['msgContent'] =
                                        await downloadMessage(
                                            msg.message.documentMessage,
                                            'document'
                                        )
                                    break
                                default:
                                    webhookData['msgContent'] = ''
                                    break
                            }
                        }
                        await this.SendWebhook(
                            'message',
                            'messages.upsert',
                            webhookData,
                            this.key
                        )
                    } catch (e) {
                        console.error('Error sending webhook:', e)
                    }
                }
            })
        })

        sock.ws.on('CB:call', async (data) => {
            try {
                if (data.content) {
                    if (data.content.find((e) => e.tag === 'offer')) {
                        const content = data.content.find(
                            (e) => e.tag === 'offer'
                        )
                        await this.SendWebhook(
                            'call_offer',
                            'call.events',
                            {
                                id: content.attrs['call-id'],
                                timestamp: parseInt(data.attrs.t),
                                user: {
                                    id: data.attrs.from,
                                    platform: data.attrs.platform,
                                    platform_version: data.attrs.version,
                                },
                            },
                            this.key
                        )
                    } else if (
                        data.content.find((e) => e.tag === 'terminate')
                    ) {
                        const content = data.content.find(
                            (e) => e.tag === 'terminate'
                        )
                        await this.SendWebhook(
                            'call',
                            'call.events',
                            {
                                id: content.attrs['call-id'],
                                user: {
                                    id: data.attrs.from,
                                },
                                timestamp: parseInt(data.attrs.t),
                                reason: data.content[0].attrs.reason,
                            },
                            this.key
                        )
                    }
                }
            } catch (e) {
                return
            }
        })

        // Event handlers for groups
        sock.ev.on('groups.upsert', async (groupUpsert) => {
            try {
                await GroupModel.findOneAndUpdate(
                    { key: this.key },
                    { $set: { groups: groupUpsert } },
                    { upsert: true }
                )
                await this.SendWebhook(
                    'updateGroups',
                    'groups.upsert',
                    { data: groupUpsert },
                    this.key
                )
                GroupsMetaDados.flushAll()
            } catch (e) {
                console.log('Error updating groups in MongoDB', e)
            }
        })

        sock.ev.on('groups.update', async (groupUpdate) => {
            try {
                // Update group data
                const groupDoc = await GroupModel.findOne({ key: this.key })
                if (groupDoc) {
                    // Update existing groups
                    const updatedGroups = groupDoc.groups || {}
                    groupUpdate.forEach((group) => {
                        updatedGroups[group.id] = {
                            ...updatedGroups[group.id],
                            ...group,
                        }
                    })
                    groupDoc.groups = updatedGroups
                    await groupDoc.save()
                }
                await this.SendWebhook(
                    'updateGroups',
                    'groups.update',
                    { data: groupUpdate },
                    this.key
                )
                GroupsMetaDados.flushAll()
            } catch (e) {
                console.log('Error updating groups in MongoDB', e)
            }
        })

        sock.ev.on('group-participants.update', async (groupParticipants) => {
            try {
                // Update group participants
                const groupDoc = await GroupModel.findOne({ key: this.key })
                if (groupDoc) {
                    const groups = groupDoc.groups || {}
                    const group = groups[groupParticipants.id]
                    if (group) {
                        // Update participants
                        if (groupParticipants.action === 'add') {
                            group.participants.push(
                                ...groupParticipants.participants
                            )
                        } else if (groupParticipants.action === 'remove') {
                            group.participants = group.participants.filter(
                                (p) =>
                                    !groupParticipants.participants.includes(p)
                            )
                        } else if (groupParticipants.action === 'promote') {
                            groupParticipants.participants.forEach(
                                (participant) => {
                                    const idx = group.participants.findIndex(
                                        (p) => p.id === participant
                                    )
                                    if (idx !== -1) {
                                        group.participants[idx].admin = true
                                    }
                                }
                            )
                        } else if (groupParticipants.action === 'demote') {
                            groupParticipants.participants.forEach(
                                (participant) => {
                                    const idx = group.participants.findIndex(
                                        (p) => p.id === participant
                                    )
                                    if (idx !== -1) {
                                        group.participants[idx].admin = false
                                    }
                                }
                            )
                        }
                        groups[groupParticipants.id] = group
                        groupDoc.groups = groups
                        await groupDoc.save()
                    }
                }
                await this.SendWebhook(
                    'group-participants',
                    'group-participants.update',
                    { data: groupParticipants },
                    this.key
                )
                GroupsMetaDados.flushAll()
            } catch (e) {
                console.log('Error updating group participants in MongoDB', e)
            }
        })
    }

    async deleteInstance(key) {
        const existingSession = await sessionRepository.findByKey(key)
        if (existingSession) {
            await sessionRepository.delete(key)
            // Delete auth state
            await AuthStateModel.deleteOne({ key })
            // Delete contacts
            await ContactModel.deleteOne({ key })
            // Delete groups
            await GroupModel.deleteOne({ key })
            if (this.instance.online == true) {
                this.instance.deleted = true
                await this.instance.sock.logout()
            } else {
                // Do nothing
            }
        } else {
            return {
                error: true,
                message: 'Session not found',
            }
        }
    }

    async getInstanceDetail(key) {
        let connect = this.instance?.online
        if (connect !== true) {
            connect = false
        }
        const sessionData = await sessionRepository.findByKey(key)
        return {
            instance_key: key,
            phone_connected: connect,
            browser: sessionData?.browser || 'Minha Api',
            webhook: sessionData?.webhook || false,
            base64: sessionData?.base64 || false,
            webhookUrl: sessionData?.webhookUrl || '',
            webhookEvents: sessionData?.webhookEvents || [],
            messagesRead: sessionData?.messagesRead || false,
            ignoreGroups: sessionData?.ignoreGroups || false,
            user: this.instance?.online ? this.instance.sock?.user : {},
        }
    }

    getWhatsappCode(id) {
        if (id.startsWith('55')) {
            const numero = id.slice(2)
            const ddd = numero.slice(0, 2)
            let n
            const indice = numero.indexOf('@')
            if (indice >= 1) {
                n = numero.slice(0, indice)
            } else {
                n = numero
            }
            const comprimentoSemDDD = n.slice(2).length
            if (comprimentoSemDDD < 8) {
                throw new Error('No account exists!')
            } else if (comprimentoSemDDD > 9) {
                throw new Error('No account exists.')
            } else if (parseInt(ddd) <= 27 && comprimentoSemDDD < 9) {
                let novoNumero = n.substring(0, 2) + '9' + n.substring(2)
                id = '55' + novoNumero
            } else if (parseInt(ddd) > 27 && comprimentoSemDDD > 8) {
                let novoNumero = n.substring(0, 2) + n.substring(3)
                id = '55' + novoNumero
            }
            return id
        } else {
            return id
        }
    }

    getWhatsAppId(id) {
        id = id.replace(/\D/g, '')
        if (id.includes('@g.us') || id.includes('@s.whatsapp.net')) return id
        return id.includes('-') ? `${id}@g.us` : `${id}@s.whatsapp.net`
    }

    getGroupId(id) {
        if (id.includes('@g.us') || id.includes('@g.us')) return id
        return id.includes('-') ? `${id}@g.us` : `${id}@g.us`
    }

    async lerMensagem(idMessage, to) {
        try {
            const msg = await this.getMessage(idMessage, to)
            if (msg) {
                await this.instance.sock.readMessages([msg.key])
            }
        } catch (e) {
            console.error('Error marking message as read:', e)
        }
    }

    async verifyId(id) {
        const cachedResult = await this.verifyCache(id)
        if (cachedResult) {
            return cachedResult.jid
        } else {
            try {
                const [result] = await this.instance.sock.onWhatsApp(id)
                if (result.exists) {
                    await this.salvaCache(id, result)
                    return result.jid
                } else {
                    throw new Error(
                        `The number ${id} is not a valid WhatsApp number`
                    )
                }
            } catch (error) {
                throw new Error(
                    `The number ${id} is not a valid WhatsApp number`
                )
            }
        }
    }

    async verifyCache(id) {
        const cachedItem = cache.get(id)
        if (cachedItem) {
            return cachedItem
        } else {
            return null
        }
    }

    async salvaCache(id, result) {
        cache.set(id, result)
    }

    async sendTextMessage(data) {
        let to = data.id

        if (data.typeId === 'user') {
            to = await this.verifyId(to)
        } else {
            await this.verifyGroup(to)
        }

        if (data.options && data.options.delay && data.options.delay > 0) {
            await this.setStatus(
                'composing',
                to,
                data.typeId,
                data.options.delay
            )
        }

        let mentions = false

        if (
            data.typeId === 'group' &&
            data.groupOptions &&
            data.groupOptions.markUser
        ) {
            if (data.groupOptions.markUser === 'ghostMention') {
                const metadata = await this.groupidinfo(to)
                mentions = metadata.participants.map(
                    (participant) => participant.id
                )
            } else {
                mentions = this.parseParticipants(data.groupOptions.markUser)
            }
        }

        let quoted = { quoted: null }

        if (data.options && data.options.replyFrom) {
            const msg = await this.getMessage(data.options.replyFrom, to)
            if (msg) {
                quoted = { quoted: msg }
            }
        }

        const sendOptions = {
            text: data.message,
            mentions,
        }

        if (quoted.quoted) {
            sendOptions.quoted = quoted.quoted
        }

        const send = await this.instance.sock.sendMessage(to, sendOptions)

        return send
    }

    async assertSessions(group) {
        console.log('Processing group ' + group + ' started')
        if (GroupsMetaDados.get('assert' + group + this.key)) {
            return
        } else {
            const metadados = await this.groupidinfo(group)
            const phoneNumbers = metadados.participants.map(
                (participant) => participant.id
            )
            for (let i = phoneNumbers.length - 1; i >= 0; i--) {
                const lid = phoneNumbers[i]
                this.queue.push({ lid }, (err) => {
                    if (err) {
                        console.error(`Error processing ${lid}:`, err)
                    } else {
                        console.log(`Processing of ${lid} completed.`)
                    }
                })
            }
            GroupsMetaDados.set('assert' + group + this.key, true)
        }
    }

    async assertAll() {
        try {
            const result = await this.groupFetchAllParticipating()
            for (const key in result) {
                if (result[key].size > 300) {
                    this.assertSessions(result[key].id)
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    async assertSession(lid) {
        try {
            const devices = []
            const additionalDevices = await this.instance.sock.getUSyncDevices(
                [lid],
                false,
                false
            )
            devices.push(...additionalDevices)
            const senderKeyJids = []
            for (const { user, device } of devices) {
                const jid = jidEncode(
                    user,
                    isLid ? 'lid' : 's.whatsapp.net',
                    device
                )
                senderKeyJids.push(jid)
            }
            await this.instance.sock.assertSessions(senderKeyJids)
        } catch (error) {
            console.log(error)
        }
    }

    async getMessage(idMessage, to) {
        try {
            const msg = await this.instance.sock.loadMessage(to, idMessage)
            return msg
        } catch (error) {
            console.error('Error fetching message:', error)
            return null
        }
    }

    async sendMediaFile(data, origem) {
        let to = data.id

        if (data.typeId === 'user') {
            to = await this.verifyId(to)
        } else {
            await this.verifyGroup(to)
        }

        let caption = ''
        if (data.options && data.options.caption) {
            caption = data.options.caption
        }

        let mentions = false

        if (
            data.typeId === 'group' &&
            data.groupOptions &&
            data.groupOptions.markUser
        ) {
            if (data.groupOptions.markUser === 'ghostMention') {
                const metadata = await this.groupidinfo(to)
                mentions = metadata.participants.map(
                    (participant) => participant.id
                )
            } else {
                mentions = this.parseParticipants(data.groupOptions.markUser)
            }
        }

        let quoted = { quoted: null }
        let cacheOptions = { useCachedGroupMetadata: false }
        if (data.typeId === 'group') {
            const metadados = await this.groupidinfo(to)
            const meta = metadados.participants.map(
                (participant) => participant.id
            )
            cacheOptions = { useCachedGroupMetadata: meta }
        }

        if (data.options && data.options.replyFrom) {
            const msg = await this.getMessage(data.options.replyFrom, to)

            if (msg) {
                quoted = { quoted: msg }
            }
        }

        const acepty = ['audio', 'document', 'video', 'image']

        if (!acepty.includes(data.type)) {
            throw new Error('Arquivo invalido')
        }

        const origin = ['url', 'base64', 'file']
        if (!origin.includes(origem)) {
            throw new Error('Metodo de envio invalido')
        }

        let type = false
        let mimetype = false
        let filename = false
        let file = false
        let audio = false
        let document = false
        let video = false
        let image = false
        let thumb = false
        let send

        let myArray
        if (data.type === 'image') {
            myArray = config.imageMimeTypes
        } else if (data.type === 'video') {
            myArray = config.videoMimeTypes
        } else if (data.type === 'audio') {
            myArray = config.audioMimeTypes
        } else {
            myArray = config.documentMimeTypes
        }

        if (origem === 'url') {
            const parsedUrl = url.parse(data.url)
            if (
                parsedUrl.protocol === 'http:' ||
                parsedUrl.protocol === 'https:'
            ) {
                mimetype = await this.GetFileMime(data.url)

                if (!myArray.includes(mimetype.trim())) {
                    throw new Error(
                        'Arquivo ' +
                            mimetype +
                            ' não é permitido para ' +
                            data.type
                    )
                }

                origem = data.url
            }
        } else if (origem === 'base64') {
            if (!data.filename || data.filename === '') {
                throw new Error('Nome do arquivo é obrigatorio')
            }

            mimetype = getMIMEType.lookup(data.filename)

            if (!myArray.includes(mimetype.trim())) {
                throw new Error(
                    'Arquivo ' + mimetype + ' não é permitido para ' + data.type
                )
            }
        }

        if (data.type === 'audio') {
            if (mimetype === 'audio/ogg') {
                if (data.options && data.options.delay) {
                    if (data.options.delay > 0) {
                        await this.instance.sock?.sendPresenceUpdate(
                            'recording',
                            to
                        )
                        await delay(data.options.delay * 1000)
                    }
                }

                type = {
                    url: data.url,
                }
                mimetype = 'audio/mp4'
                filename = await this.getFileNameFromUrl(data.url)
            } else {
                audio = await this.convertToMP4(origem)
                mimetype = 'audio/mp4'
                type = await fs.readFile(audio)
                if (data.options && data.options.delay) {
                    if (data.options.delay > 0) {
                        await this.instance.sock?.sendPresenceUpdate(
                            'recording',
                            to
                        )
                        await delay(data.options.delay * 1000)
                    }
                }
            }
        } else if (data.type === 'video') {
            if (mimetype === 'video/mp4') {
                type = {
                    url: data.url,
                }
                thumb = await this.thumbURL(data.url)
                filename = await this.getFileNameFromUrl(data.url)
            } else {
                video = await this.convertTovideoMP4(origem)
                mimetype = 'video/mp4'
                type = await fs.readFile(video)
                thumb = await this.thumbBUFFER(video)
            }
        } else {
            if (!data.base64string) {
                type = {
                    url: data.url,
                }

                filename = await this.getFileNameFromUrl(data.url)
            } else {
                const buffer = Buffer.from(data.base64string, 'base64')

                filename = data.filename
                const file = path.join('temp/', filename)

                const join = await fs.writeFile(file, buffer)
                type = await fs.readFile('temp/' + filename)
            }
        }

        send = await this.instance.sock?.sendMessage(
            to,
            {
                mimetype: mimetype,
                [data.type]: type,
                caption: caption,
                ptt: data.type === 'audio' ? true : false,
                fileName: filename ? filename : file.originalname,
                mentions,
            },
            { ...quoted, ...cacheOptions }
        )

        if (
            data.type === 'audio' ||
            data.type === 'video' ||
            data.type == 'document'
        ) {
            if (data.type === 'video') {
                const ms = JSON.parse(JSON.stringify(send))
                ms.message.videoMessage.thumb = thumb
                send = ms
            }

            const tempDirectory = 'temp/'
            const files = await fs.readdir(tempDirectory)

            await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(tempDirectory, file)
                    await fs.unlink(filePath)
                })
            )
        }

        return send
    }

    async sendMedia(
        to,
        userType,
        file,
        type,
        caption = '',
        replyFrom = false,
        d = false
    ) {
        if (userType === 'user') {
            to = await this.verifyId(to)
        } else {
            await this.verifyGroup(to)
        }

        const acepty = ['audio', 'document', 'video', 'image']

        let myArray
        if (type === 'image') {
            myArray = config.imageMimeTypes
        } else if (type === 'video') {
            myArray = config.videoMimeTypes
        } else if (type === 'audio') {
            myArray = config.audioMimeTypes
        } else {
            myArray = config.documentMimeTypes
        }

        const mime = file.mimetype

        if (!myArray.includes(mime.trim())) {
            throw new Error('Arquivo ' + mime + ' não é permitido para ' + type)
        }

        if (!acepty.includes(type)) {
            throw new Error('Type not valid')
        }

        let mimetype = false
        let filename = false
        let buferFile = false
        if (type === 'audio') {
            if (d > 0) {
                await this.instance.sock?.sendPresenceUpdate('recording', to)
                await delay(d * 1000)
            }

            if (mime === 'audio/ogg') {
                const filePath = file.originalname
                const extension = path.extname(filePath)

                mimetype = 'audio/mp4'
                filename = file.originalname
                buferFile = file.buffer
            } else {
                filename = uuidv4() + '.mp4'

                const audio = await this.convertToMP4(file.buffer)
                mimetype = 'audio/mp4'
                buferFile = await fs.readFile(audio)
            }
        } else if (type === 'video') {
            if (mime === 'video/mp4') {
                const filePath = file.originalname
                const extension = path.extname(filePath)

                mimetype = 'video/mp4'
                filename = file.originalname
                buferFile = file.buffer
            } else {
                filename = uuidv4() + '.mp4'

                const video = await this.convertTovideoMP4(file.buffer)
                mimetype = 'video/mp4'
                buferFile = await fs.readFile(video)
            }
        } else {
            const filePath = file.originalname
            const extension = path.extname(filePath)

            const mimetype = getMIMEType.lookup(extension)
            filename = file.originalname
            buferFile = file.buffer
        }

        let quoted = { quoted: null }
        if (replyFrom) {
            const msg = await this.getMessage(replyFrom, to)

            if (msg) {
                quoted = { quoted: msg }
            }
        }
        let cacheOptions = { useCachedGroupMetadata: false }
        if (userType === 'group') {
            const metadados = await this.groupidinfo(to)
            const meta = metadados.participants.map(
                (participant) => participant.id
            )
            cacheOptions = { useCachedGroupMetadata: meta }
        }

        const data = await this.instance.sock?.sendMessage(
            to,
            {
                [type]: buferFile,
                caption: caption,
                mimetype: mimetype,
                ptt: type === 'audio' ? true : false,
                fileName: filename,
            },
            { ...quoted, ...cacheOptions }
        )

        if (type === 'audio' || type === 'video') {
            const tempDirectory = 'temp/'
            const files = await fs.readdir(tempDirectory)

            await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(tempDirectory, file)
                    await fs.unlink(filePath)
                })
            )
        }

        return data
    }
    async DownloadProfile(of, group = false) {
        try {
            if (!group) {
                of = await this.verifyId(of)
            } else {
                await this.verifyGroup(of)
            }

            const ppUrl = await this.instance.sock?.profilePictureUrl(
                of,
                'image'
            )
            return ppUrl
        } catch (e) {
            return process.env.APP_URL + '/img/noimage.jpg'
        }
    }
    async getUserStatus(of) {
        of = await this.verifyId(of)
        const status = await this.instance.sock?.fetchStatus(of)
        return status
    }
    async contacts() {
        // Updated to use MongoDB
        try {
            const contactDoc = await ContactModel.findOne({ key: this.key })
            if (contactDoc) {
                return {
                    error: false,
                    contacts: contactDoc.contacts,
                }
            } else {
                return {
                    error: true,
                    message: 'Contacts have not been loaded yet.',
                }
            }
        } catch (error) {
            return {
                error: true,
                message: 'Error fetching contacts from database.',
            }
        }
    }

    async blockUnblock(to, data) {
        try {
            if (!data === 'block') {
                data = 'unblock'
            }

            to = await this.verifyId(to)
            const status = await this.instance.sock?.updateBlockStatus(to, data)
            return status
        } catch (e) {
            return {
                error: true,
                message: 'Failed to block/unblock',
            }
        }
    }

    async sendButtonMessage(to, data) {
        to = await this.verifyId(to)
        const result = await this.instance.sock?.sendMessage(to, {
            templateButtons: processButton(data.buttons),
            text: data.text ?? '',
            footer: data.footerText ?? '',
            viewOnce: true,
        })
        return result
    }

    async sendContactMessage(to, data) {
        to = await this.verifyId(to)
        const vcard = generateVC(data)
        const result = await this.instance.sock?.sendMessage(to, {
            contacts: {
                displayName: data.fullName,
                contacts: [
                    {
                        displayName: data.fullName,
                        vcard,
                    },
                ],
            },
        })
        return result
    }
    async sendListMessage(to, type, options, groupOptions, data) {
        if (type === 'user') {
            to = await this.verifyId(to)
        } else {
            await this.verifyGroup(to)
        }
        if (options && options.delay && options.delay > 0) {
            await this.setStatus('composing', to, type, options.delay)
        }

        let mentions = false

        if (type === 'group' && groupOptions && groupOptions.markUser) {
            if (groupOptions.markUser === 'ghostMention') {
                const metadata = await this.instance.sock?.groupMetadata(
                    this.getGroupId(to)
                )
                mentions = metadata.participants.map(
                    (participant) => participant.id
                )
            } else {
                mentions = this.parseParticipants(groupOptions.markUser)
            }
        }

        let quoted = {
            quoted: null,
        }

        if (options && options.replyFrom) {
            const msg = await this.getMessage(options.replyFrom, to)

            if (msg) {
                quoted = {
                    quoted: msg,
                }
            }
        }

        const msgList = {
            text: data.title,
            title: data.title,
            description: data.description,
            buttonText: data.buttonText,
            footerText: data.footerText,
            sections: data.sections,
            listType: 2,
        }

        let idlogado = await this.idLogado()
        const msgRes = generateWAMessageFromContent(
            to,
            {
                listMessage: msgList,
                mentions,
            },
            quoted,
            {
                idlogado,
            }
        )

        const result = await this.instance.sock?.relayMessage(
            to,
            msgRes.message,
            {
                messageId: msgRes.key.id,
            }
        )

        return msgRes
    }
    async sendMediaButtonMessage(to, data) {
        to = await this.verifyId(to)

        const result = await this.instance.sock?.sendMessage(
            this.getWhatsAppId(to),
            {
                [data.mediaType]: {
                    url: data.image,
                },
                footer: data.footerText ?? '',
                caption: data.text,
                templateButtons: processButton(data.buttons),
                mimetype: data.mimeType,
                viewOnce: true,
            }
        )
        return result
    }

    async createJid(number) {
        if (!isNaN(number)) {
            const jid = `${number}@s.whatsapp.net`
            return jid
        } else {
            return number
        }
    }
    async setStatus(status, to, type, pause = false) {
        try {
            if (type === 'user') {
                to = await this.verifyId(to)
            } else {
                await this.verifyGroup(to)
            }

            const result = await this.instance.sock?.sendPresenceUpdate(
                status,
                to
            )
            if (pause > 0) {
                await delay(pause * 1000)
                await this.instance.sock?.sendPresenceUpdate('paused', to)
            }
            return result
        } catch (e) {
            throw new Error(
                'Failed to send presence, check the ID and try again'
            )
        }
    }

    async updateProfilePicture(to, url, type) {
        try {
            if (type === 'user') {
                to = await this.verifyId(this.getWhatsAppId(to))
            } else {
                await this.verifyGroup(to)
            }

            const img = await axios.get(url, {
                responseType: 'arraybuffer',
            })
            const res = await this.instance.sock?.updateProfilePicture(
                to,
                img.data
            )
            return {
                error: false,
                message: 'Profile picture updated successfully!',
            }
        } catch (e) {
            console.log(e)
            return {
                error: true,
                message: 'Unable to update profile picture',
            }
        }
    }
    async mystatus(status) {
        try {
            const result = await this.instance.sock?.sendPresenceUpdate(status)
            return {
                error: false,
                message: 'Status changed to ' + status,
            }
        } catch (e) {
            return {
                error: true,
                message: 'Failed to change status to ' + status,
            }
        }
    }

    // Get user or group object from db by id
    async getUserOrGroupById(id) {
        try {
            let Chats = await this.getChat()
            const group = Chats.find((c) => c.id === this.getWhatsAppId(id))
            if (!group)
                throw new Error(
                    'Unable to get group, check if the group exists'
                )
            return group
        } catch (e) {
            console.error(e)
            console.error('Error get group failed')
        }
    }

    // Group Methods
    parseParticipants(users) {
        return users.map((user) => this.getWhatsAppId(user))
    }

    async createNewGroup(name, users) {
        try {
            const group = await this.instance.sock?.groupCreate(
                name,
                users.map(this.getWhatsAppId)
            )
            return group
        } catch (e) {
            return {
                error: true,
                message: 'Error creating the group',
            }
        }
    }

    async groupFetchAllParticipating() {
        // Updated to use MongoDB
        try {
            const groupDoc = await GroupModel.findOne({ key: this.key })
            if (groupDoc) {
                return groupDoc.groups
            } else {
                const result =
                    await this.instance.sock?.groupFetchAllParticipating()
                if (result && Object.keys(result).length > 0) {
                    await GroupModel.findOneAndUpdate(
                        { key: this.key },
                        { $set: { groups: result } },
                        { upsert: true }
                    )
                    return result
                } else {
                    return {}
                }
            }
        } catch (e) {
            console.log('Error fetching groups from database', e)
            return {}
        }
    }

    async verifyGroup(id) {
        // Updated to use MongoDB
        try {
            if (GroupsMetaDados.get(id + this.key)) {
                return true
            }
            const result = await this.groupFetchAllParticipating()
            if (result.hasOwnProperty(id)) {
                GroupsMetaDados.set(id + this.key, true)
                return true
            } else {
                throw new Error('Group does not exist')
            }
        } catch (error) {
            console.log(error)
            throw new Error('Group does not exist')
        }
    }

    async addNewParticipant(id, users) {
        try {
            await this.verifyGroup(id)

            const res = await this.instance.sock?.groupParticipantsUpdate(
                this.getGroupId(id),
                users.map(this.getWhatsAppId),
                'add'
            )
            return res
        } catch {
            return {
                error: true,
                message:
                    'Unable to add participant, you must be an admin in this group',
            }
        }
    }

    async makeAdmin(id, users) {
        try {
            await this.verifyGroup(id)
            const res = await this.instance.sock?.groupParticipantsUpdate(
                this.getGroupId(id),
                users.map(this.getWhatsAppId),
                'promote'
            )
            return res
        } catch {
            return {
                error: true,
                message:
                    'Unable to promote participant, you must be an admin in this group',
            }
        }
    }

    async removeuser(id, users) {
        try {
            await this.verifyGroup(id)

            const res = await this.instance.sock?.groupParticipantsUpdate(
                this.getGroupId(id),
                users.map(this.getWhatsAppId),
                'remove'
            )
            return res
        } catch {
            return {
                error: true,
                message:
                    'Unable to remove participant, you must be an admin in this group',
            }
        }
    }

    async demoteAdmin(id, users) {
        try {
            await this.verifyGroup(id)

            const res = await this.instance.sock?.groupParticipantsUpdate(
                this.getGroupId(id),
                users.map(this.getWhatsAppId),
                'demote'
            )
            return res
        } catch {
            return {
                error: true,
                message:
                    'Unable to demote participant, you must be an admin in this group',
            }
        }
    }

    async idLogado() {
        const user_instance = this.instance.sock?.user.id
        const user = this.getWhatsAppId(user_instance.split(':')[0])
        return user
    }

    async joinURL(url) {
        try {
            const partesDaURL = url.split('/')
            const codigoDoGrupo = partesDaURL[partesDaURL.length - 1]

            const entrar = await this.instance.sock?.groupAcceptInvite(
                codigoDoGrupo
            )
            // await this.updateGroupData();
            GroupsMetaDados.flushAll()

            return entrar
        } catch (e) {
            return {
                error: true,
                message:
                    'Error joining via URL, check if the URL is still valid or if the group is open.',
            }
        }
    }

    async leaveGroup(id) {
        try {
            await this.verifyGroup(id)
            await this.instance.sock?.groupLeave(id)

            return {
                error: false,
                message: 'Left the group.',
            }
        } catch (e) {
            return {
                error: true,
                message:
                    'Error leaving the group, check if the group still exists.',
            }
        }
    }

    async getInviteCodeGroup(id) {
        try {
            await this.verifyGroup(id)
            const convite = await this.instance.sock?.groupInviteCode(id)
            const url = 'https://chat.whatsapp.com/' + convite
            return url
        } catch (e) {
            return {
                error: true,
                message:
                    'Error getting the group invite code, check if you are an admin or if the group exists.',
            }
        }
    }

    async getInstanceInviteCodeGroup(id) {
        try {
            await this.verifyGroup(id)
            return await this.instance.sock?.groupInviteCode(id)
        } catch (e) {
            console.error(e)
            console.error('Error get invite group failed')
        }
    }
    async groupSettingUpdate(id, action) {
        try {
            await this.verifyGroup(id)
            const res = await this.instance.sock?.groupSettingUpdate(id, action)
            return {
                error: false,
                message: 'Change related to ' + action + ' completed',
            }
        } catch (e) {
            // console.log(e)
            return {
                error: true,
                message:
                    'Error changing ' +
                    action +
                    ' Check if you have permission or if the group exists',
            }
        }
    }

    async groupUpdateSubject(id, subject) {
        try {
            await this.verifyGroup(id)
            const res = await this.instance.sock?.groupUpdateSubject(
                this.getWhatsAppId(id),
                subject
            )
            return {
                error: false,
                message: 'Group name changed to ' + subject,
            }
        } catch (e) {
            // console.log(e)
            return {
                error: true,
                message:
                    'Error changing the group, check if you are an admin or if the group exists',
            }
        }
    }

    async groupUpdateDescription(id, description) {
        try {
            await this.verifyGroup(id)
            const res = await this.instance.sock?.groupUpdateDescription(
                id,
                description
            )
            // console.log(res)
            return {
                error: false,
                message: 'Group description changed to ' + description,
            }
        } catch (e) {
            return {
                error: true,
                message:
                    'Failed to change the group description, check if you are an admin or if the group exists',
            }
        }
    }

    async groupGetInviteInfo(url) {
        try {
            const codeurl = url.split('/')
            const code = codeurl[codeurl.length - 1]

            const res = await this.instance.sock?.groupGetInviteInfo(code)

            return res
        } catch (e) {
            // console.log(e)
            return {
                error: true,
                message:
                    'Failed to verify the group. Check the URL code or if the group still exists.',
            }
        }
    }

    async readMessage(msgObj) {
        try {
            const key = {
                remoteJid: msgObj.remoteJid,
                id: msgObj.id,
                participant: msgObj?.participant, // required when reading a msg from group
            }
            const res = await this.instance.sock?.readMessages([key])
            return res
        } catch (e) {
            console.error('Error read message failed')
        }
    }

    async reactMessage(id, key, emoji) {
        try {
            const reactionMessage = {
                react: {
                    text: emoji, // use an empty string to remove the reaction
                    key: key,
                },
            }
            const res = await this.instance.sock?.sendMessage(
                this.getWhatsAppId(id),
                reactionMessage
            )
            return res
        } catch (e) {
            console.error('Error react message failed')
        }
    }
}

exports.WhatsAppInstance = WhatsAppInstance
