import express from 'express'
import {identityServer, messages} from 'subtext'

function waiter(promise) {
  promise
    .then((rv) => { if(rv !== undefined) console.log(rv) })
    .catch((e) => { console.error(e.stack || e) })
}

waiter((async function() {
  let [varPath, publicUrl] = process.argv.slice(2)
  let server = await identityServer(varPath, publicUrl)
  if(! server.keyPair) {
    console.log('creating keyPair')
    await server.setKeyPair(messages.randomKeyPair())
  }
  server.events.on('message', (peerId, {message, me}) => {
    waiter((async function() {
      if(me) return
      let peer = await server.getPeer(peerId)
      await server.sendMessage(peer, {
        type: 'Message',
        text: `You said "${message.text}"`,
      })
    })())
  })
  let app = express()
  app.use(server.createApp())
  let http = app.listen(+(process.env.PORT || 8000))
  console.log('card url:', server.myCardUrl)
})())
