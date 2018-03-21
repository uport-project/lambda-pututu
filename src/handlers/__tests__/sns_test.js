const SnsHandler = require("../sns");
const UportMgr = require("../../lib/uPortMgr");
const SnsMgr = require("../../lib/snsMgr");

describe("SnsHandler", () => {
  let sut;
  let snsMgrMock = new SnsMgr();
  let validToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiIyb294SjZ3V3V4UTE0aWloUU1NNHNzc2VyZVdjUEU0c1dRSCIsImlhdCI6MTUxNTcwMTA5OSwicHJldmlvdXMiOiJRbVJNdmdMSENMYmJFck5YRkgzeWJhNW1wVms2NHV5U1JBaXNNYnAyQVV0RDNKIiwiZXhwIjoxNTE1Nzg3NDk5fQ._ki2ihwOIclqCXShjbh2J0A3mNw3uHnjV5UlB4J6Y7pCImc413_wxzCP1wjQ9tN1Rfzih7GeDvL3huWUy2t9Mg";
  let messageId =
    "e37961d8153b209724520f48c7c1c781431302011de144425732be5f6bff23f2";

  beforeAll(() => {
    sut = new SnsHandler(snsMgrMock);
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
    sut.handle(
      { headers: { Authorization: { type: "othertype" } } },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(403);
        expect(err.message).toEqual("type is not notifications");
        done();
      }
    );
  });

  test("handle invalid token", done => {
    sut.handle(
      { headers: { Authorization: { type: "notifications" } } },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.code).toEqual(403);
        expect(err.message).toEqual("value missing");
        done();
      }
    );
  });
});
