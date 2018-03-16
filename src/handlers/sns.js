class SnsHandler {
  constructor(snsMgr) {
    this.snsMgr = snsMgr;
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

    if (authHead.type !== "notifications") {
      cb({ code: 403, message: "type is not notifications" });
      return;
    }
    if (authHead.value === undefined) {
      cb({ code: 403, message: "value missing" });
      return;
    }

    let fullArn = authHead.value;
    let app;
    let vsA = req.authorization.value.split("/");
    vsA[0] = vsA[0].replace("endpoint", "app");
    let vs = vsA.join("/");

    let app = await this.snsMgr.verifyEndpointArn(vs);
    if (!app) {
      cb({ code: 400, message: "endpointArn not supported" });
      return;
    }

    try {
      const user = await this.snsMgr.getUser(fullArn);
    } catch (err) {
      console.log("Error on sns.snsMgr.getUser");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    let encmessage = event.body.message;
    let senderId = authHead.aud;
    let recipientId = authHead.iss;

    let payload;

    try {
      payload = await this.snsMgr.createMessage(
        senderId,
        recipientId,
        encmessage
      );
    } catch (err) {
      console.log("Error on sns.snsMgr.createMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    try {
      const messageId = await this.snsMgr.sendMessage(fullArn, payload);
      cb(null, messageId);
    } catch (err) {
      console.log("Error on this.snsMgr.sendMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
  }
}

module.exports = SnsHandler;
