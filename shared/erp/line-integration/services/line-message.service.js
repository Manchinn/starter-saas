const { LineBotClient } = require('@line/bot-sdk')
const { decrypt } = require('../../../../server/modules/line/line.crypto')

// @line/bot-sdk v11+ — factory builds Messaging API delegates.
// `new LineBotClient({ channelAccessToken })` leaves pushMessage non-functional.
function client(connection) {
  return LineBotClient.fromChannelAccessToken({
    channelAccessToken: decrypt(connection.channelAccessTokenEncrypted),
  })
}

async function pushText(connection, lineUserId, text) {
  if (!connection.isActive || !lineUserId) return
  await client(connection).pushMessage({ to: lineUserId, messages: [{ type: 'text', text }] })
}

module.exports = { pushText }
