const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util


const {did, privateKey}=Credentials.createIdentity();

const credentials = new Credentials({
    appName: 'Test', did, privateKey
})

let endpoint = ''
const app = express();
app.use(bodyParser.json({ type: '*/*' }))


app.get('/', (req, res) => {
    //Create a new disclosure request, requesting the push notification token
    credentials.createDisclosureRequest({
      notifications: true,
      accountType: 'keypair',
      callbackUrl: endpoint + '/callback'
    }).then(disclosureRequestJWT => {
      //Create QR code with the disclosure request.
      const uri = message.paramsToQueryString(message.messageToURI(disclosureRequestJWT), {callback_type: 'post'})
      const qr =  transports.ui.getImageDataURI(uri)
      res.send(`<div><img src="${qr}"/></div>`)
    })
  })

app.post('/callback', (req, res) => {
    const access_token = req.body.access_token
    credentials.authenticateDisclosureResponse(access_token).then(userProfile => {
        //console.log({userProfile}, "\n\n")
        //userProfile.pushToken, userProfile.boxPub
        const env={
            "values": [
                {
                    "key": "pututuUrl",
                    "value": process.argv[2]
                },
                {
                    "key": "authToken",
                    "value": userProfile.pushToken
                },
                {
                    "key": "message",
                    "value": "encMessage"
                },
    
            ]
        }
        console.log(JSON.stringify(env,null,3));
        process.exit(0)
    })
  })
  
// run the app server and tunneling service
const server = app.listen(8088, () => {
    ngrok.connect(8088).then(ngrokUrl => {
        endpoint = ngrokUrl
        console.error(`# Share your pushToken. Open at ${endpoint}`)
    })
})

