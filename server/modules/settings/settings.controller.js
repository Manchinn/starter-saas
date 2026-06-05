const service = require('./settings.service')

module.exports = {
  getEmail(req, res) {
    res.json({ success: true, data: service.getEmailSettings() })
  },

  updateEmail(req, res) {
    try {
      const data = service.updateEmailSettings(req.body)
      res.json({ success: true, data })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Failed to save email settings' })
    }
  },

  async testConnection(req, res) {
    try {
      const data = await service.testConnection()
      res.json({ success: true, data })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Connection failed' })
    }
  },

  async sendTest(req, res) {
    try {
      const data = await service.sendTestEmail(req.body.to)
      res.json({ success: true, data })
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Failed to send test email' })
    }
  },
}
