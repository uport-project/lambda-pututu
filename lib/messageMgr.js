class MessageMgr {
  constructor() {
    this.pg_url = null;
  }

  isSecretsSet() {
    return this.pgUrl !== null;
  }

  setSecrets(secrets) {
    this.pgUrl = secrets.PG_URL;
  }

  async getMessage(messageId) {
    if (!messageId) throw "no message id";
    if (!this.pgUrl) throw "no pgUrl set";

    const pgClient = new Client({
      connectionString: this.pgUrl
    });

    try {
      await pgClient.connect();
      let qry = "SELECT * FROM messages WHERE id = $1";
      const res = await pgClient.query(qry, [messageId]);
      return res.rows[0];
    } catch (e) {
      throw e;
    } finally {
      await pgClient.end();
    }
  }

  async getAllMessages(recipientId) {
    if (!recipientId) throw "no recipient id";
    if (!this.pgUrl) throw "no pgUrl set";

    const pgClient = new Client({
      connectionString: this.pgUrl
    });

    try {
      await pgClient.connect();
      let qry = "SELECT * FROM messages WHERE recipient = $1";
      const res = await pgClient.query(qry, [recipientId]);
      return res.rows;
    } catch (e) {
      throw e;
    } finally {
      await pgClient.end();
    }
  }
}
module.exports = MessageMgr;
