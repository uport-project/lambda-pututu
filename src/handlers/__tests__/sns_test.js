const SnsHandler = require("../sns");
const UportMgr = require("../../lib/uPortMgr");
const SnsMgr = require("../../lib/snsMgr");

describe("SnsHandler", () => {
  let sut;
  let snsMgrMock = new SnsMgr();
  let uportMgrMock = new UportMgr();
  let validToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjgyMzc2OTcsImV4cCI6MTYyODIzNzY5NywidHlwZSI6Im90cmFjb3NhIiwiaXNzIjoiZGlkOnVwb3J0OjEyMzQ1NjcifQ.NFq7h3rZbbqThLiUzFkqRT_MRw5borMRB2JCVXXgHXzYfq3CLjvsPGYHaMxl3aUcdULAkdjd5hkfy41cyf_FFA";

  beforeAll(() => {
    sut = new SnsHandler(snsMgrMock, uportMgrMock);
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
    uportMgrMock.verifyToken = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve({ payload: { type: "othertype" } });
    });
    let authToken = "Bearer " + validToken;
    sut.handle({ headers: { Authorization: authToken } }, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.message).toEqual("type is not notifications");
      expect(err.code).toEqual(403);

      done();
    });
    uportMgrMock.verifyToken.mockClear();
  });

  test("handle invalid token", done => {
    sut.handle(
      { headers: { Authorization: "Bearer 12345" } },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.message).toEqual("Invalid token");
        expect(err.code).toEqual(401);
        done();
      }
    );
  });
});
