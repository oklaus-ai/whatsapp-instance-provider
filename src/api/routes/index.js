const express = require('express')
const router = express.Router()
const instanceRoutes = require('./instance.route')
const mdbInstanceRoutes = require('./mdb.instance.route')
const messageRoutes = require('./message.route')
const mdbMessageRoutes = require('./mdb.message.route')
const miscRoutes = require('./misc.route')
const groupRoutes = require('./group.route')
//const managerRoutes = require('./manager.route');

router.get('/status', (req, res) => res.send('OK'))
router.use('/instance', instanceRoutes)
router.use('/mdb/instance', mdbInstanceRoutes)
router.use('/mdb/message', mdbMessageRoutes)
router.use('/message', messageRoutes)
router.use('/group', groupRoutes)
router.use('/misc', miscRoutes)
//router.get('/', (req, res) => res.redirect('/manager/login'));
//router.use('/manager', managerRoutes); // Adiciona as rotas de gerenciamento aqui

module.exports = router
