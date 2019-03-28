class SnsHandler {
  constructor(snsMgr, uPortMgr) {
    this.snsMgr = snsMgr;
    this.uPortMgr = uPortMgr;
  }

  async handle(event, context, cb) {
    console.log("Starting ...");
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

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      cb({ code: 403, message: "no json body: " + e.toString() });
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

    let app = await this.snsMgr.verifyEndpointArn(vs);
    if (!app) {
      cb({ code: 400, message: "endpointArn not supported" });
      return;
    }
    console.log(app);

    let user;
    try {
      user = await this.snsMgr.getUser(app,fullArn);
    } catch (err) {
      console.log("Error on sns.snsMgr.getUser");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
    console.log(user);

    //Check if user is stil enabled

    let encMessage = body.message;
    let alert = body.alert;
    let senderId = payload.aud;
    let recipientId = payload.iss;

    let msgPayload;
    try {
      msgPayload = await this.snsMgr.createMessage(
        senderId,
        recipientId,
        encMessage,
        alert
      );
    } catch (err) {
      console.log("Error on sns.snsMgr.createMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
    console.log(msgPayload);

    try {
      const messageId = await this.snsMgr.sendMessage(app,fullArn,msgPayload);
      console.log("messageId: "+messageId);
      cb(null,messageId); return;
    } catch (err) {
      console.log("Error on sns.snsMgr.sendMessage");
      console.log(err);
      cb({ code: 500, message: err.message });
      return;
    }
    
  }
}

module.exports = SnsHandler;
