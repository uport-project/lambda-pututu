'use strict'
const AWS = require('aws-sdk');
const kms = new AWS.KMS();
const querystring = require('querystring');

const AuthMgr = require('./lib/authMgr');
const UPortMgr = require('./lib/uPortMgr');
const MessageMgr = require('./lib/messageMgr');
const PushNotificationMgr = require('./lib/pushNotificationMgr');

const SnsHandler = require('./handlers/sns');
const MessageGetHandler = require('./handlers/message_get');
const MessageDeleteHandler = require('./handlers/message_delete');

let authMgr = new AuthMgr();
let uPortMgr = new UPortMgr();
let pushNotificationMgr = new PushNotificationMgr();
let messageMgr = new MessageMgr();

let snsHandler = new RecaptchaHandler(authMgr, uPortMgr, pushNotificationMgr);
let messageGetHandler = new MessageGetHandler(uPortMgr, messageMgr);
let messageDeleteHandler = new MessageDeleteHandler(uPortMgr, messageMgr);


module.exports.sns = (event, context, callback) => {
  postHandler(snsHandler, event, context, callback)
}
module.exports.message_get = (event, context, callback) => {
  postHandler(messageGetHandler, event, context, callback)
}
module.exports.message_delete = (event, context, callback) => {
  postHandler(messageDeleteHandler, event, context, callback)
}

const postHandler = (handler, event, context, callback) => {
  if (!authMgr.isSecretsSet() ||
    !uPortMgr.isSecretsSet() ||
    !messageMgr.isSecretsSet() ||
    !pushNotificationMgr.isSecretsSet()) {
    kms.decrypt({
      CiphertextBlob: Buffer(process.env.SECRETS, 'base64')
    }).promise().then(data => {
      const decrypted = String(data.Plaintext)
      authMgr.setSecrets(JSON.parse(decrypted))
      uPortMgr.setSecrets(JSON.parse(decrypted))
      pushNotificationMgr.setSecrets(JSON.parse(decrypted))
      messageMgr.setSecrets(JSON.parse(decrypted))
      doHandler(handler, event, context, callback)
    })
  } else {
    doHandler(handler, event, context, callback)
  }
}

const doHandler = (handler, event, context, callback) => {
  handler.handle(event, context, (err, resp) => {
    let response;
    if (err == null) {
      response = {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          data: resp
        })
      }
    } else {
      //console.log(err);
      let code = 500;
      if (err.code) code = err.code;
      let message = err;
      if (err.message) message = err.message;

      response = {
        statusCode: code,
        body: JSON.stringify({
          status: 'error',
          message: message
        })
      }
    }

    callback(null, response)
  })

}
