"use strict";
const AWS = require("aws-sdk");

const UPortMgr = require("./lib/uPortMgr");
const MessageMgr = require("./lib/messageMgr");
const SnsMgr = require("./lib/snsMgr");

const SnsHandler = require("./handlers/sns");
const MessageGetHandler = require("./handlers/message_get");
const MessageDeleteHandler = require("./handlers/message_delete");

let uPortMgr = new UPortMgr();
let snsMgr = new SnsMgr();
let messageMgr = new MessageMgr();

let snsHandler = new SnsHandler(snsMgr);
let messageGetHandler = new MessageGetHandler(uPortMgr, messageMgr);
let messageDeleteHandler = new MessageDeleteHandler(uPortMgr, messageMgr);

const doHandler = (handler, event, context, callback) => {
  handler.handle(event, context, (err, resp) => {
    let response;
    if (err == null) {
      response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({
          status: "success",
          data: resp
        })
      };
    } else {
      //console.log(err);
      let code = 500;
      if (err.code) code = err.code;
      let message = err;
      if (err.message) message = err.message;

      response = {
        statusCode: code,
        body: JSON.stringify({
          status: "error",
          message: message
        })
      };
    }

    callback(null, response);
  });
};

const postHandler = (handler, event, context, callback) => {
  if (!messageMgr.isSecretsSet() || !snsMgr.isSecretsSet()) {
    const kms = new AWS.KMS();
    kms
      .decrypt({
        CiphertextBlob: Buffer(process.env.SECRETS, "base64")
      })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext);
        snsMgr.setSecrets(JSON.parse(decrypted));
        messageMgr.setSecrets(JSON.parse(decrypted));
        doHandler(handler, event, context, callback);
      });
  } else {
    doHandler(handler, event, context, callback);
  }
};

module.exports.sns = (event, context, callback) => {
  postHandler(snsHandler, event, context, callback);
};
module.exports.message_get = (event, context, callback) => {
  postHandler(messageGetHandler, event, context, callback);
};
module.exports.message_delete = (event, context, callback) => {
  postHandler(messageDeleteHandler, event, context, callback);
};
