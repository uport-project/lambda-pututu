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

  async verifyNisaba(event) {
    if (!event.headers) throw "no headers";
    if (!event.headers["Authorization"]) throw "no Authorization Header";
    if (!this.nisabaPub) throw "nisabaPub not set";

    let authHead = event.headers["Authorization"];

    let parts = authHead.split(" ");
    if (parts.length !== 2) {
      throw "Format is Authorization: Bearer [token]";
    }
    let scheme = parts[0];
    if (scheme !== "Bearer") {
      throw "Format is Authorization: Bearer [token]";
    }

    let dtoken;
    try {
      dtoken = decodeToken(parts[1]);
    } catch (err) {
      console.log(err);
      throw "Invalid JWT token";
    }

    //Verify Signature
    try {
      let verified = new TokenVerifier("ES256k", this.nisabaPub).verify(
        parts[1]
      );
      if (!verified) throw "not verified";
    } catch (err) {
      console.log(err);
      throw "Invalid signature in JWT token";
    }

    // TODO verify: iat, exp, aud
    return dtoken.payload;
  }
}
module.exports = SnsMgr;
