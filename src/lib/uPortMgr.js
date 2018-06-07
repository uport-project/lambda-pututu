require("ethr-did-resolver")();
require("uport-did-resolver")();
import { verifyJWT, createJWT, decodeJWT } from "did-jwt/lib/JWT";

class UportMgr {
  async verifyToken(token) {
    if (!token) throw "no token";
    let audience;
    try {
      audience = decodeJWT(token).payload.aud;
    } catch (error) {
      console.log("token doesn't have audience", error);
    }
    return verifyJWT(token, { audience });
  }

  async createToken(options, payload) {
    if (!payload) throw "no payload";
    return createJWT(payload, options);
  }
}
module.exports = UportMgr;
