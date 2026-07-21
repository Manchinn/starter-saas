const crypto = require('crypto')
const config = require('../../config/config')

function key() {
  const value = config.line.credentialEncryptionKey
  if (!value) throw { status: 503, message: 'LINE credential encryption is not configured' }
  const parsed = Buffer.from(value, 'base64')
  if (parsed.length !== 32) throw { status: 503, message: 'LINE_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key' }
  return parsed
}

function encrypt(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.')
}

function decrypt(value) {
  const [ivText, tagText, cipherText] = String(value || '').split('.')
  if (!ivText || !tagText || !cipherText) throw { status: 500, message: 'Stored LINE credential is invalid' }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(cipherText, 'base64')), decipher.final()]).toString('utf8')
}

module.exports = { encrypt, decrypt }
