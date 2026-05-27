const service = require('./system.service')

module.exports = {
  async testDb(req, res) {
    try {
      const result = await service.testConnection(req.body)
      res.json({ success: true, data: result })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Connection failed' })
    }
  },

  async configureDb(req, res) {
    try {
      const result = await service.configureDb(req.body)
      res.json({ success: true, data: result })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Configuration failed' })
    }
  },

  dbStatus(req, res) {
    res.json({ success: true, data: service.dbStatus() })
  },
}
