import SNS from "sns-mobile";
import sha3 from "solidity-sha3";

class SnsMgr {
  constructor() {
    this.sns_key_id = null;
    this.sns_key_secret = null;
    this.android_arn = null;
    this.ios_arn = null;
    this.ios_sandbox_arn = null;
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
  }

  async verifyEndpointArn(vs) {
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
    if (vs === androidApp.platformApplicationArn) app = androidApp;
    if (vs === iosApp.platformApplicationArn) app = iosApp;
    if (vs === iosSandboxApp.platformApplicationArn) app = iosSandboxApp;
    return app;
  }

  async createMessage(senderId, recipientId, encmessage) {
    if (!senderId) throw "no senderId";
    if (!recipientId) throw "no recipientId";
    if (!encmessage) throw "no encmessage";

    const messageHash = sha3(
      senderId + ":" + recipientId + ":" + encmessage + ":" + Date.now()
    ).slice(2);
    const message = "New secure message";
    //ToDo: Store message in bd

    //ToDo: get message count by recipient from bd
    let count;

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
}
module.exports = SnsMgr;
