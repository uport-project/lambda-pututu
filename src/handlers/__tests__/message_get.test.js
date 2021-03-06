jest.mock("pg");
const { Client } = require("pg");
let pgClientMock = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};
Client.mockImplementation(() => {
  return pgClientMock;
});

const MessageGetHandler = require("../message_get");
const UportMgr = require("../../lib/uPortMgr");
const MessageMgr = require("../../lib/messageMgr");

describe("MessageGetHandler", () => {
  let sut;
  let uportMgrMock = new UportMgr();
  let messageMgrMock = new MessageMgr();
  let validToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1MTU3MDEwOTYsInR5cGUiOiJ1c2VyLWF1dGgiLCJpc3MiOiJkaWQ6ZXRocjoweDhlNWE0OWQ5ZTViYWMxODE2OTM2MGY5N2RkODlkYjRjNWQ3YTExYTEifQ.GkXkrdArICLRy2daZlJ90tZxm1HA5V_0nz_17O2i4vfDUFAeliBWiKHVvUVHeDT-Bo_brk2lcA3SZaLIluoatwA";
  let messageId =
    "e37961d8153b209724520f48c7c1c781431302011de144425732be5f6bff23f2";

  beforeAll(() => {
    messageMgrMock.getMessage = jest.fn();
    sut = new MessageGetHandler(uportMgrMock, messageMgrMock);
  });

  test("empty constructor", () => {
    expect(sut).not.toBeUndefined();
  });

  test("handle null event", done => {
    sut.handle({}, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.code).toEqual(403);
      expect(err.message).toEqual("no headers");
      done();
    });
  });

  test("handle empty header", done => {
    sut.handle({ headers: "{}" }, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.code).toEqual(403);
      expect(err.message).toEqual("no authorization header");
      done();
    });
  });

  test("handle malformed auth header", done => {
    sut.handle({ headers: { Authorization: "Token" } }, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.code).toEqual(401);
      expect(err.message).toEqual("Format is Authorization: Bearer [token]");
      done();
    });
  });

  test("handle mispelled Bearer, in auth", done => {
    sut.handle({ headers: { Authorization: "Bier Token" } }, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.code).toEqual(401);
      expect(err.message).toEqual("Format is Authorization: Bearer [token]");
      done();
    });
  });

  test("handle invalid token", done => {
    sut.handle(
      { headers: { Authorization: "Bearer asdf" } },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(401);
        expect(err.message).toEqual("Invalid token");
        done();
      }
    );
  });

  test("handle fail token", done => {
    messageMgrMock.getMessage = jest.fn().mockImplementationOnce( () => {throw Error("fail")});
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
        pathParameters: {
          id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33"
        }
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(500);
        expect(err.message).toEqual("fail");
        done();
      }
    );
  });

  test("handle fail getMessage", done => {
    messageMgrMock.getMessage = jest.fn().mockImplementationOnce( () => {throw Error("fail")});
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
        pathParameters: {
          id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33"
        }
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(500);
        expect(err.message).toEqual("fail");
        done();
      }
    );
  });

  test("handle message not found", done => {
    messageMgrMock.getMessage = jest.fn().mockImplementationOnce( () => { return Promise.resolve(null) });
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
        pathParameters: {
          id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33"
        }
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(404);
        expect(err.message).toEqual("message not found");
        done();
      }
    );
  });

  test("handle access to message forbidden", done => {
    messageMgrMock.getMessage = jest.fn().mockImplementationOnce( () => { 
      return Promise.resolve({
        recipient: "did:some:weird"
      }); 
    });
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
        pathParameters: {
          id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33"
        }
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(403);
        expect(err.message).toEqual("access to message forbidden");
        done();
      }
    );
  });


  test("happy path (with id)", done => {
    messageMgrMock.getMessage = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve({
        id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33",
        sender: "35DDXwF6Hdr6dQQo1BRwQru7W3d54avzBwk",
        recipient: "did:ethr:0x8e5a49d9e5bac18169360f97dd89db4c5d7a11a1",
        message: "abcdef",
        created: Date.now()
      });
    });

    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
        pathParameters: {
          id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33"
        }
      },
      {},
      (err, res) => {
        expect(err).toBeNull();
        done();
      }
    );
  });


  test("handle fail getAllMessages", done => {
    messageMgrMock.getAllMessages = jest.fn().mockImplementationOnce( () => {throw Error("fail getAllMessages")});
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(500);
        expect(err.message).toEqual("fail getAllMessages");
        done();
      }
    );
  });

  test.skip("handle message not found (all messages)", done => {
    messageMgrMock.getAllMessages = jest.fn().mockImplementationOnce( () => { return Promise.resolve([]) });
    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(404);
        expect(err.message).toEqual("messages not found");
        done();
      }
    );
  });

  test.skip("happy path (all)", done => {
    messageMgrMock.getAllMessages = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve([{
        id: "14e7404952d6c3314f764a104eec71f46f7c1f60bcd2cef91126348e125cdf33",
        sender: "35DDXwF6Hdr6dQQo1BRwQru7W3d54avzBwk",
        recipient: "did:ethr:0x8e5a49d9e5bac18169360f97dd89db4c5d7a11a1",
        message: "abcdef",
        created: Date.now()
      }]);
    });

    sut.handle(
      {
        headers: { Authorization: "Bearer " + validToken },
      },
      {},
      (err, res) => {
        expect(err).toBeNull();
        done();
      }
    );
  });
  
});


