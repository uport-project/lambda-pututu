import SNS from "sns-mobile";
import sha3 from "solidity-sha3";
import { Client } from "pg";

class SnsMgr {
  constructor() {
    this.sns_key_id = null;
    this.sns_key_secret = null;
    this.android_arn = null;
    this.ios_arn = null;
    this.ios_sandbox_arn = null;
    this.pgUrl = null;
  }

  isSecretsSet() {
    return (
      this.sns_key_id !== null ||
      this.sns_key_secret !== null ||
      this.android_arn !== null ||
      this.ios_arn !== null ||
      this.ios_sandbox_arn !== null
    );
  }

  setSecrets(secrets) {
    this.sns_key_id = secrets.SNS_KEY_ID;
    this.sns_key_secret = secrets.SNS_KEY_SECRET;
    this.android_arn = secrets.ANDROID_ARN;
    this.ios_arn = secrets.IOS_ARN;
    this.ios_sandbox_arn = secrets.IOS_SANDBOX_ARN;
    this.pgUrl = secrets.PG_URL;
  }

  async verifyEndpointArn(vs) {
    if (!vs) throw "no platform application ARN";
    let app;
    let androidApp = new SNS({
      platform: SNS.SUPPORTED_PLATFORMS.ANDROID,
      region: "us-west-2",
      apiVersion: "2010-03-31",
      accessKeyId: this.sns_key_id,
      secretAccessKey: this.sns_key_secret,
      platformApplicationArn: this.android_arn
    });

    let iosApp = new SNS({
      platform: SNS.SUPPORTED_PLATFORMS.IOS,
      region: "us-west-2",
      apiVersion: "2010-03-31",
      accessKeyId: this.sns_key_id,
      secretAccessKey: this.sns_key_secret,
      platformApplicationArn: this.ios_arn,
      sandbox: false
    });

    let iosSandboxApp = new SNS({
      platform: SNS.SUPPORTED_PLATFORMS.IOS,
      region: "us-west-2",
      apiVersion: "2010-03-31",
      accessKeyId: this.sns_key_id,
      secretAccessKey: this.sns_key_secret,
      platformApplicationArn: this.ios_sandbox_arn,
      sandbox: true
    });

    if (vs.includes(androidApp.platformApplicationArn)) app = androidApp;
    if (vs.includes(iosApp.platformApplicationArn)) app = iosApp;
    if (vs.includes(iosSandboxApp.platformApplicationArn)) app = iosSandboxApp;
    return app;
  }

  async createMessage(senderId, recipientId, encmessage, alert) {
    if (!senderId) throw "no senderId";
    if (!recipientId) throw "no recipientId";
    if (!encmessage) throw "no encmessage";

    const messageHash = sha3(
      [senderId, recipientId, encmessage, Date.now().toString()].join(":")
    ).slice(2);
    const message = alert || "New secure message";
    await this.storeMessage(messageHash, senderId, recipientId, encmessage);

    let count = await this.getCountbyRecipient(recipientId);

    const apnStr = JSON.stringify({
      aps: {
        alert: message,
        badge: count
      },
      uport: {
        clientId: senderId,
        messageHash: messageHash
      }
    });

    const payload = {
      default: message,
      APNS: apnStr,
      APNS_SANDBOX: apnStr,
      GCM: JSON.stringify({
        data: {
          clientId: senderId,
          messageHash: messageHash,
          custom_notification: {
            body: message,
            title: "uPort",
            clientId: senderId,
            icon: "notification_icon"
          }
        }
      })
    };
    return payload;
  }

  async storeMessage(messagehash, senderId, recipientId, message) {
    if (!messagehash) throw "no message hash";
    if (!senderId) throw "no sender id";
    if (!recipientId) throw "no recipient id";
    if (!message) throw "no encrypted message";
    if (!this.pgUrl) throw "no pgUrl set";

    const pgClient = new Client({
      connectionString: this.pgUrl
    });

    try {
      await pgClient.connect();
      let qry =
        "INSERT INTO messages (id, sender, recipient, message) VALUES ($1, $2, $3, $4);";
      const res = await pgClient.query(qry, [
        messagehash,
        senderId,
        recipientId,
        message
      ]);
      return;
    } catch (e) {
      throw e;
    } finally {
      await pgClient.end();
    }
  }

  async getCountbyRecipient(recipientId) {
    if (!recipientId) throw "no recipient id";
    if (!this.pgUrl) throw "no pgUrl set";

    const pgClient = new Client({
      connectionString: this.pgUrl
    });

    try {
      await pgClient.connect();
      let qry = "SELECT count(*) as num FROM messages WHERE recipient = $1";
      const res = await pgClient.query(qry, [recipientId]);
      return res.rows[0].num;
    } catch (e) {
      throw e;
    } finally {
      await pgClient.end();
    }
  }
}
module.exports = SnsMgr;
