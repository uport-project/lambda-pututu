require("ethr-did-resolver")();
require("uport-did-resolver")();
import { verifyJWT, createJWT, decodeJWT } from "did-jwt/lib/JWT";

class UportMgr {
  async verifyToken(token) {
    if (!token) throw "no token";
    const audience = decodeJWT(token).payload.aud;
    return verifyJWT(token, { audience });
  }

  async createToken(options, payload) {
    if (!payload) throw "no payload";
    return createJWT(payload, options);
  }
}
module.exports = UportMgr;
