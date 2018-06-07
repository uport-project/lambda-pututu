class SnsHandler {
  constructor(snsMgr, uPortMgr) {
    this.snsMgr = snsMgr;
    this.uPortMgr = uPortMgr;
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

    if (payload.type !== "notifications") {
      cb({ code: 403, message: "type is not notifications" });
      return;
    }
    if (payload.value === undefined) {
      cb({ code: 403, message: "value missing" });
      return;
    }

    let fullArn = payload.value;
    let vsA = fullArn.split("/");
    vsA[0] = vsA[0].replace("endpoint", "app");
    let vs = vsA.join("/");

    console.log("vs", vs);
    let app = await this.snsMgr.verifyEndpointArn(vs);
    if (!app) {
      cb({ code: 400, message: "endpointArn not supported" });
      return;
    }

    try {
      await app.getUser(fullArn);
    } catch (err) {
      console.log("Error on sns.getUser");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    let msgPayload;
    let encMessage = event.body["message"] || event.body;
    let senderId = payload.aud;
    let recipientId = payload.iss;

    try {
      msgPayload = await this.snsMgr.createMessage(
        senderId,
        recipientId,
        encMessage
      );
    } catch (err) {
      console.log("Error on sns.snsMgr.createMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }

    try {
      const messageId = await this.snsMgr.storeMessage(fullArn, msgPayload);
      cb(null, messageId);
    } catch (err) {
      console.log("Error on this.snsMgr.storeMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
  }
}

module.exports = SnsHandler;
