import express from 'express'
import {identityServer, messages} from 'subtext'

const SUBOT_SCRIPT = process.env.SUBOT_SCRIPT

function waiter(promise) {
  promise
    .then((rv) => { if(rv !== undefined) console.log(rv) })
    .catch((e) => { console.error(e.stack || e) })
}

waiter((async function() {
  let [varPath, publicUrl] = process.argv.slice(2)
  let server = await identityServer(varPath, publicUrl)
  let api = {
    server: server,
    onMessage: async function(peer, message) {
      await server.sendMessage(peer, {
        type: 'Message',
        text: `You said "${message.text}"`,
      })
    },
  }
  if(! server.keyPair) {
    console.log('creating keyPair')
    await server.setKeyPair(messages.randomKeyPair())
  }
  server.events.on('message', (peerId, {message, me}) => {
    waiter((async function() {
      if(me) return
      let peer = await server.getPeer(peerId)
      await api.onMessage(peer, message)
    })())
  })
  let app = express()
  app.use(server.createApp())
  let http = app.listen(+(process.env.PORT || 8000))
  console.log('card url:', server.myCardUrl)
  if(SUBOT_SCRIPT) require(SUBOT_SCRIPT).default(api)
})())
