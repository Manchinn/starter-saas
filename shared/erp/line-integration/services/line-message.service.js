const { LineBotClient } = require('@line/bot-sdk')
const { decrypt } = require('../../../../server/modules/line/line.crypto')

function client(connection) {
  return new LineBotClient({ channelAccessToken: decrypt(connection.channelAccessTokenEncrypted) })
}

async function pushText(connection, lineUserId, text) {
  if (!connection.isActive || !lineUserId) return
  await client(connection).pushMessage({ to: lineUserId, messages: [{ type: 'text', text }] })
}

module.exports = { pushText }
