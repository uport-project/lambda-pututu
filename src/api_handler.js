"use strict";
const createJsendHandler = require("./lib/jsend");
const createSecretsWrappedHandler = require("./lib/secrets_wrapper");

//Load Mgrs
const UPortMgr = require("./lib/uPortMgr");
const MessageMgr = require("./lib/messageMgr");
const SnsMgr = require("./lib/snsMgr");

//Instanciate Mgr
let uPortMgr = new UPortMgr();
let snsMgr = new SnsMgr();
let messageMgr = new MessageMgr();

//Mgr that needs secrets handling
const secretsMgrArr=[snsMgr,messageMgr];

//Load handlers
const SnsHandler = require("./handlers/sns");
const MessageGetHandler = require("./handlers/message_get");
const MessageDeleteHandler = require("./handlers/message_delete");

//Instanciate handlers
const snsHandler = createJsendHandler(new SnsHandler(snsMgr, uPortMgr));
const messageGetHandler = createJsendHandler(new MessageGetHandler(uPortMgr, messageMgr));
const messageDeleteHandler = createJsendHandler(new MessageDeleteHandler(uPortMgr, messageMgr));

//Exports for serverless
module.exports.sns = createSecretsWrappedHandler(secretsMgrArr,snsHandler);
module.exports.message_get = createSecretsWrappedHandler(secretsMgrArr,messageGetHandler);
module.exports.message_delete = createSecretsWrappedHandler(secretsMgrArr,messageDeleteHandler);
