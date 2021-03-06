const didJWT = require('did-jwt')

class UportMgr {

  constructor() {
    require('ethr-did-resolver').default()
    require("uport-did-resolver").default();
  }

  async verifyToken(token) {
    if (!token) throw "no token";
    let audience;
    try {
      audience = didJWT.decodeJWT(token).payload.aud;
    } catch (error) {
      console.log("token doesn't have audience", error);
    }
    return didJWT.verifyJWT(token, { audience });
  }
  
}
module.exports = UportMgr;
