/**
 * LINE Rich Menu API passthrough.
 *
 * All rich menu operations are thin wrappers over the @line/bot-sdk client.
 * Image upload/download delegates to setRichMenuImage / getRichMenuImage on
 * the LineBotClient (which internally routes to the MessagingApiBlobClient on
 * api-data.line.me). No local persistence — the LINE platform is the source of
 * truth.
 */
const { LineBotClient } = require('@line/bot-sdk')
const { decrypt } = require('./line.crypto')
const { LineConnection } = require('../../../../server/models')

// @line/bot-sdk v11+ factory — same as line-message.service.js.
function client(connection) {
  return LineBotClient.fromChannelAccessToken({
    channelAccessToken: decrypt(connection.channelAccessTokenEncrypted),
  })
}

/**
 * Resolve an active connection by organization id.
 * Throws { status: 404 } when no connection exists or { status: 400 } when inactive.
 */
async function resolveConnection(organizationId) {
  const conn = await LineConnection.findOne({
    where: { organizationId },
  })
  if (!conn) throw { status: 404, message: 'LINE connection not configured for this organization' }
  if (!conn.isActive) throw { status: 400, message: 'LINE connection is inactive' }
  return conn
}

// ---- Rich menu CRUD ----

async function listRichMenus(organizationId) {
  const conn = await resolveConnection(organizationId)
  const result = await client(conn).getRichMenuList()
  // SDK returns RichMenuListResponse with `richmenus` array (lowercase).
  return result.richmenus || result || []
}

async function getRichMenu(organizationId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  return client(conn).getRichMenu(richMenuId)
}

async function createRichMenu(organizationId, richMenu) {
  const conn = await resolveConnection(organizationId)
  validateRichMenuPayload(richMenu)
  return client(conn).createRichMenu(richMenu)
}

async function validateRichMenuObject(organizationId, richMenu) {
  const conn = await resolveConnection(organizationId)
  validateRichMenuPayload(richMenu)
  await client(conn).validateRichMenuObject(richMenu)
  return { valid: true }
}

async function deleteRichMenu(organizationId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).deleteRichMenu(richMenuId)
  return { deleted: true }
}

// ---- Image ----

/**
 * Upload a rich menu image.
 * `imageBase64` is the base64-encoded image bytes.
 * `contentType` must be `image/jpeg` or `image/png`.
 * Delegates to the SDK's setRichMenuImage which routes to api-data.line.me.
 */
async function uploadRichMenuImage(organizationId, richMenuId, imageBase64, contentType) {
  const conn = await resolveConnection(organizationId)
  if (!['image/jpeg', 'image/png'].includes(contentType)) {
    throw { status: 400, message: 'contentType must be image/jpeg or image/png' }
  }
  const body = Buffer.from(imageBase64, 'base64')
  await client(conn).setRichMenuImage(richMenuId, body)
  return { uploaded: true }
}

/**
 * Download a rich menu image.
 * Returns { data: base64-data-uri, contentType: string } for client display.
 * The SDK's getRichMenuImage returns a Readable stream; we collect it here.
 */
async function downloadRichMenuImage(organizationId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  const readable = await client(conn).getRichMenuImage(richMenuId)
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)
  const base64 = buffer.toString('base64')
  // LINE returns JPEG for rich menu images by default.
  const contentType = 'image/jpeg'
  return { data: `data:${contentType};base64,${base64}`, contentType }
}

// ---- Default menu ----

async function setDefaultRichMenu(organizationId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).setDefaultRichMenu(richMenuId)
  return { default: true }
}

async function getDefaultRichMenu(organizationId) {
  const conn = await resolveConnection(organizationId)
  try {
    const result = await client(conn).getDefaultRichMenuId()
    return { richMenuId: result.richMenuId }
  } catch (err) {
    // SDK wraps LINE errors; 404 means no default set.
    if (err.status === 404 || (err.originalError?.response?.status === 404)) {
      return { richMenuId: null }
    }
    throw err
  }
}

async function cancelDefaultRichMenu(organizationId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).cancelDefaultRichMenu()
  return { default: false }
}

// ---- Per-user link ----

async function linkRichMenuToUser(organizationId, userId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).linkRichMenuIdToUser(userId, richMenuId)
  return { linked: true }
}

async function getRichMenuOfUser(organizationId, userId) {
  const conn = await resolveConnection(organizationId)
  try {
    const result = await client(conn).getRichMenuIdOfUser(userId)
    return { richMenuId: result.richMenuId }
  } catch (err) {
    if (err.status === 404 || (err.originalError?.response?.status === 404)) {
      return { richMenuId: null }
    }
    throw err
  }
}

async function unlinkRichMenuFromUser(organizationId, userId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).unlinkRichMenuIdFromUser(userId)
  return { unlinked: true }
}

// ---- Alias ----

async function createRichMenuAlias(organizationId, aliasId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  if (!/^[a-z0-9_-]{1,32}$/.test(aliasId)) {
    throw { status: 400, message: 'aliasId must be 1–32 lowercase alphanumeric chars, hyphens, or underscores' }
  }
  // SDK expects { richMenuAliasId, richMenuId } object.
  await client(conn).createRichMenuAlias({ richMenuAliasId: aliasId, richMenuId })
  return { richMenuAliasId: aliasId, richMenuId }
}

async function listRichMenuAliases(organizationId) {
  const conn = await resolveConnection(organizationId)
  const result = await client(conn).getRichMenuAliasList()
  // SDK returns RichMenuAliasListResponse with `aliases` array.
  return result.aliases || result || []
}

async function getRichMenuAlias(organizationId, aliasId) {
  const conn = await resolveConnection(organizationId)
  return client(conn).getRichMenuAlias(aliasId)
}

async function updateRichMenuAlias(organizationId, aliasId, richMenuId) {
  const conn = await resolveConnection(organizationId)
  // SDK expects (richMenuAliasId, { richMenuId }) — two args.
  await client(conn).updateRichMenuAlias(aliasId, { richMenuId })
  return { richMenuAliasId: aliasId, richMenuId }
}

async function deleteRichMenuAlias(organizationId, aliasId) {
  const conn = await resolveConnection(organizationId)
  await client(conn).deleteRichMenuAlias(aliasId)
  return { deleted: true }
}

// ---- Bulk (user-level, 1–500 users per call) ----

async function bulkLinkRichMenu(organizationId, richMenuId, userIds) {
  const conn = await resolveConnection(organizationId)
  validateBulkUserIds(userIds)
  await client(conn).linkRichMenuIdToUsers({ richMenuId, userIds })
  return { linked: true, count: userIds.length }
}

async function bulkUnlinkRichMenu(organizationId, userIds) {
  const conn = await resolveConnection(organizationId)
  validateBulkUserIds(userIds)
  await client(conn).unlinkRichMenuIdFromUsers({ userIds })
  return { unlinked: true, count: userIds.length }
}

// ---- Batch (menu-level, 1–1000 operations per batch) ----

/**
 * Submit a batch of rich menu operations.
 * Uses *WithHttpInfo to capture the requestId from the response header
 * (x-line-request-id), because the SDK's plain return does not expose it.
 */
async function submitRichMenuBatch(organizationId, batchRequest) {
  const conn = await resolveConnection(organizationId)
  validateBatchRequest(batchRequest)
  const result = await client(conn).richMenuBatchWithHttpInfo(batchRequest)
  const requestId = result.httpResponse.headers.get('x-line-request-id') || null
  return { requestId }
}

async function validateRichMenuBatchRequest(organizationId, batchRequest) {
  const conn = await resolveConnection(organizationId)
  validateBatchRequest(batchRequest)
  await client(conn).validateRichMenuBatchRequest(batchRequest)
  return { valid: true }
}

async function getRichMenuBatchProgress(organizationId, requestId) {
  const conn = await resolveConnection(organizationId)
  const result = await client(conn).getRichMenuBatchProgress(requestId)
  return {
    phase: result.phase,
    acceptedTime: result.acceptedTime,
    completedTime: result.completedTime || null,
  }
}

// ---- Bulk/Batch validators ----

function validateBulkUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw { status: 400, message: 'userIds must be a non-empty array' }
  }
  if (userIds.length > 500) {
    throw { status: 400, message: 'userIds cannot exceed 500 per bulk call' }
  }
}

const VALID_BATCH_TYPES = new Set(['link', 'unlink', 'unlinkAll'])

function validateBatchRequest(batchRequest) {
  if (!batchRequest || !Array.isArray(batchRequest.operations) || batchRequest.operations.length === 0) {
    throw { status: 400, message: 'operations must be a non-empty array' }
  }
  if (batchRequest.operations.length > 1000) {
    throw { status: 400, message: 'operations cannot exceed 1000 per batch' }
  }
  if (batchRequest.resumeRequestKey !== undefined) {
    if (typeof batchRequest.resumeRequestKey !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(batchRequest.resumeRequestKey)) {
      throw { status: 400, message: 'resumeRequestKey must be 1–100 alphanumeric chars, hyphens, or underscores' }
    }
  }
  for (const op of batchRequest.operations) {
    if (!VALID_BATCH_TYPES.has(op.type)) {
      throw { status: 400, message: `invalid operation type: ${op.type}. Must be link, unlink, or unlinkAll` }
    }
    if (op.type === 'link') {
      if (!op.from || !op.to) throw { status: 400, message: 'link operation requires from and to (rich menu IDs)' }
    }
    if (op.type === 'unlink') {
      if (!op.from) throw { status: 400, message: 'unlink operation requires from (rich menu ID)' }
    }
    // unlinkAll has no required fields besides type
  }
  // unlinkAll cannot be combined with other types in the same request
  const types = batchRequest.operations.map(o => o.type)
  if (types.includes('unlinkAll') && types.some(t => t !== 'unlinkAll')) {
    throw { status: 400, message: 'unlinkAll cannot be combined with other operation types in the same batch' }
  }
}

// ---- Helpers ----

const REQUIRED_FIELDS = ['size', 'selected', 'name', 'chatBarText', 'areas']

function validateRichMenuPayload(richMenu) {
  for (const field of REQUIRED_FIELDS) {
    if (richMenu[field] === undefined || richMenu[field] === null) {
      throw { status: 400, message: `${field} is required` }
    }
  }
  if (!richMenu.size || typeof richMenu.size.width !== 'number' || typeof richMenu.size.height !== 'number') {
    throw { status: 400, message: 'size.width and size.height must be numbers' }
  }
  if (!Array.isArray(richMenu.areas) || richMenu.areas.length === 0) {
    throw { status: 400, message: 'areas must be a non-empty array' }
  }
  if (richMenu.areas.length > 20) {
    throw { status: 400, message: 'areas cannot exceed 20' }
  }
  if (typeof richMenu.chatBarText !== 'string' || richMenu.chatBarText.length > 14) {
    throw { status: 400, message: 'chatBarText must be a string of at most 14 characters' }
  }
  if (typeof richMenu.name !== 'string' || richMenu.name.length > 300) {
    throw { status: 400, message: 'name must be a string of at most 300 characters' }
  }
}

module.exports = {
  listRichMenus,
  getRichMenu,
  createRichMenu,
  validateRichMenuObject,
  deleteRichMenu,
  uploadRichMenuImage,
  downloadRichMenuImage,
  setDefaultRichMenu,
  getDefaultRichMenu,
  cancelDefaultRichMenu,
  linkRichMenuToUser,
  getRichMenuOfUser,
  unlinkRichMenuFromUser,
  createRichMenuAlias,
  listRichMenuAliases,
  getRichMenuAlias,
  updateRichMenuAlias,
  deleteRichMenuAlias,
  // Batch & Bulk
  bulkLinkRichMenu,
  bulkUnlinkRichMenu,
  submitRichMenuBatch,
  validateRichMenuBatchRequest,
  getRichMenuBatchProgress,
}
