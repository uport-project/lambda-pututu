require("ethr-did-resolver")();
require("uport-did-resolver")();
import { verifyJWT, createJWT } from "did-jwt/lib/JWT";

class UportMgr {
  async verifyToken(token) {
    if (!token) throw "no token";
    return verifyJWT(token);
  }

  async createToken(options, payload) {
    if (!payload) throw "no payload";
    return createJWT(payload, options);
  }
}
module.exports = UportMgr;
