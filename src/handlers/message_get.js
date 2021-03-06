class MessageGetHandler {
  constructor(uPortMgr, messageMgr) {
    this.uPortMgr = uPortMgr;
    this.messageMgr = messageMgr;
  }

  async handle(event, context, cb) {
    if (!event.headers) {
      cb({ code: 403, message: "no headers" });
      return;
    }
    if (!event.headers["Authorization"]) {
      cb({ code: 403, message: "no authorization header" });
      return;
    }

    let authHead = event.headers["Authorization"];

    let parts = authHead.split(" ");
    if (parts.length !== 2) {
      cb({ code: 401, message: "Format is Authorization: Bearer [token]" });
      return;
    }
    let scheme = parts[0];
    if (scheme !== "Bearer") {
      cb({ code: 401, message: "Format is Authorization: Bearer [token]" });
      return;
    }

    console.log("calling uPortMgr.verifyToken: "+parts[1]);
    let payload;
    try {
      let dtoken = await this.uPortMgr.verifyToken(parts[1]);
      payload = dtoken.payload;
    } catch (error) {
      console.log("Error on this.uportMgr.verifyToken");
      console.log(error);
      cb({ code: 401, message: "Invalid token" });
      return;
    }
    let recipientId = payload.iss;

    if (event.pathParameters && event.pathParameters.id) {
      let messageId;
      let msg;
      messageId = event.pathParameters.id;
      try {
        console.log("calling messageMgr.getMessage: "+messageId);
        msg = await this.messageMgr.getMessage(messageId);
        if (!msg) {
          cb({ code: 404, message: "message not found" }); return;
        }
        if (!msg.recipient.includes(recipientId)) {
          cb({ code: 403, message: "access to message forbidden" }); return
        }
        cb(null, msg); return;
      } catch (error) {
        console.log("Error on this.messageMgr.getMessage");
        console.log(error);
        cb({ code: 500, message: error.message });
        return;
      }
    } else {
      try {
        console.log("calling messageMgr.getAllMessages: "+recipientId);
        let messages = await this.messageMgr.getAllMessages(recipientId);
        if (messages.length === 0) {
          cb({ code: 404, message: "messages not found" }); return;
        }
        cb(null, messages); return;
      } catch (error) {
        console.log("Error on this.messageMgr.getAllMessages");
        console.log(error);
        cb({ code: 500, message: error.message });
        return;
      }
    }
  }
}

module.exports = MessageGetHandler;
