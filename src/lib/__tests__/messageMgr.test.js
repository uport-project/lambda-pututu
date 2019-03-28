jest.mock("pg");
const { Client }  = require("pg");
let pgClientMock = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};
Client.mockImplementation(() => {
  return pgClientMock;
});

const MessageMgr = require("../messageMgr");

describe("MessageMgr", () => {
  let sut;
  let senderId = 1234;
  let recipientId = 2345;
  let encmessage = "secretmessage";
  let messagehash =
    "e37961d8153b209724520f48c7c1c781431302011de144425732be5f6bff23f2";

  beforeAll(() => {
    sut = new MessageMgr();
  });

  test("empty constructor", () => {
    expect(sut).not.toBeUndefined();
  });

  test("getMessage() fail if no pgUrl", done => {
    sut
      .getMessage(messagehash)
      .then(resp => {
        fail("shouldn't return");
        done();
      })
      .catch(err => {
        expect(err.message).toEqual("no pgUrl set");
        done();
      });
  });

  test("getAllMessages() fail if no pgUrl", done => {
    sut
      .getAllMessages(recipientId)
      .then(resp => {
        fail("shouldn't return");
        done();
      })
      .catch(err => {
        expect(err.message).toEqual("no pgUrl set");
        done();
      });
  });

  test("deleteMessage() fail if no pgUrl", done => {
    sut
      .deleteMessage(recipientId,messagehash)
      .then(resp => {
        fail("shouldn't return");
        done();
      })
      .catch(err => {
        expect(err.message).toEqual("no pgUrl set");
        done();
      });
  });


  test("is isSecretsSet", () => {
    let secretSet = sut.isSecretsSet();
    expect(secretSet).toEqual(false);
  });

  test("setSecrets", () => {
    expect(sut.isSecretsSet()).toEqual(false);
    sut.setSecrets({
      PG_URL: "faken-pg-url"
    });
    expect(sut.isSecretsSet()).toEqual(true);
  });

  describe("getMessage()", ()=>{

    test("fail if no message id", done => {
      sut
        .getMessage()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no message id");
          done();
        });
    });
  
    test("handle query fail", done => {
      pgClientMock.query.mockImplementationOnce(() => { throw "error in query" });
      sut
        .getMessage(messagehash)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err).toEqual("error in query");
          done();
        });
    });


    test("happy path", done => {
      pgClientMock.query.mockImplementationOnce(() => {
        return Promise.resolve({
          rows: [
            {
              id: messagehash,
              sender: senderId,
              recipient: recipientId,
              message: encmessage,
              created: Date.now()
            }
          ]
        });
      });
  
      sut
        .getMessage(messagehash)
        .then(resp => {
          expect(pgClientMock.connect).toBeCalled();
          expect(pgClientMock.query).toBeCalled();
          expect(pgClientMock.query).toBeCalledWith(
            "SELECT * FROM messages WHERE id = $1",
            [messagehash]
          );
          expect(pgClientMock.end).toBeCalled();
          done();
        })
        .catch(err => {
          fail(err);
          done();
        });
    });
  
  })

  describe("getAllMessages()", ()=>{

    test("fail if no recipient id", done => {
      sut
        .getAllMessages()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no recipient id");
          done();
        });
    });
    
    test("handle query fail", done => {
      pgClientMock.query.mockImplementationOnce(() => { throw "error in query" });
      sut
        .getAllMessages(recipientId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err).toEqual("error in query");
          done();
        });
    });

    test("happy path", done => {
      pgClientMock.query.mockImplementationOnce(() => {
        return Promise.resolve({
          rows: [
            {
              id: messagehash,
              sender: senderId,
              recipient: recipientId,
              message: encmessage,
              created: Date.now()
            }
          ]
        });
      });
  
      sut
        .getAllMessages(recipientId)
        .then(resp => {
          expect(pgClientMock.connect).toBeCalled();
          expect(pgClientMock.query).toBeCalled();
          expect(pgClientMock.query).toBeCalledWith(
            "SELECT * FROM messages WHERE recipient = $1",
            [recipientId]
          );
          expect(pgClientMock.end).toBeCalled();
          done();
        })
        .catch(err => {
          fail(err);
          done();
        });
    });
  
  })

  describe("deleteMessage()", ()=>{

    test("fail no recipientId id", done => {
      sut
        .deleteMessage()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no recipient id");
          done();
        });
    });
  
    test("fail no message id", done => {
      sut
        .deleteMessage(recipientId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no message id");
          done();
        });
    });
  
    test("handle query fail", done => {
      pgClientMock.query.mockImplementationOnce(() => { throw "error in query" });
      sut
        .deleteMessage(recipientId, messagehash)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err).toEqual("error in query");
          done();
        });
    });

    test("happy path", done => {
      pgClientMock.query.mockImplementationOnce(() => {
        return Promise.resolve({
          rows: ["ok"]
        });
      });
  
      sut
        .deleteMessage(recipientId, messagehash)
        .then(resp => {
          expect(pgClientMock.connect).toBeCalled();
          expect(pgClientMock.query).toBeCalled();
          expect(pgClientMock.query).toBeCalledWith(
            "DELETE FROM messages WHERE recipient = $1 and id = $2",
            [recipientId, messagehash]
          );
          expect(pgClientMock.end).toBeCalled();
          done();
        })
        .catch(err => {
          fail(err);
          done();
        });
    });


  })
  
});
