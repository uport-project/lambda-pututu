const SnsHandler = require("../sns");
const UportMgr = require("../../lib/uPortMgr");
const SnsMgr = require("../../lib/snsMgr");

describe("SnsHandler", () => {
  let sut;
  let snsMgrMock = new SnsMgr();
  let uportMgrMock = new UportMgr();
  let validToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjgyMzc2OTcsImV4cCI6MTYyODIzNzY5NywidHlwZSI6Im90cmFjb3NhIiwiaXNzIjoiZGlkOnVwb3J0OjEyMzQ1NjcifQ.NFq7h3rZbbqThLiUzFkqRT_MRw5borMRB2JCVXXgHXzYfq3CLjvsPGYHaMxl3aUcdULAkdjd5hkfy41cyf_FFA";
  let anotherValidToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjgzOTE1OTksImV4cCI6MTUyOTY4NzU5OSwiYXVkIjoiZGlkOnVwb3J0OjJvZVh1ZkhHRHBVNTFiZktCc1pEZHU3SmU5d2VKM3I3c1ZHIiwidHlwZSI6Im5vdGlmaWNhdGlvbnMiLCJ2YWx1ZSI6ImFybjphd3M6c25zOnVzLXdlc3QtMjoxMTMxOTYyMTY1NTg6ZW5kcG9pbnQvR0NNL3VQb3J0LzFhYjAyN2U3LTY1NWMtMzZlNi1hNzE0LWE3OTEyMDhlMTE4NSIsImlzcyI6ImRpZDp1cG9ydDoyb3ZLemd5eGdmREpwczgxWmpjMWJ4eFI3WjhZNEE0blVITSJ9.sL6KmDP4jUvw-08RhRue1DrijqANuRISrs6z2ktpsxw17XUON-cnQ04XPKbLjSsEL_SZYSdPw3W4aGbjeq7eGg";

  beforeAll(() => {
    snsMgrMock.setSecrets({
      ARNDROID_ARN: "arn:aws:sns:us-west-2:113196216558:app/GCM/uPort"
    });
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

  test("handle invalid token", done => {
    sut.handle(
      {
        headers: { Authorization: "Bearer aa" },
        body: JSON.stringify({ message: "asdf" })
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.message).toEqual("Invalid token");
        expect(err.code).toEqual(401);
        done();
      }
    );
  });

  test("handle malformed auth header", done => {
    uportMgrMock.verifyToken = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve({ payload: { type: "othertype" } });
    });
    let authToken = "Bearer " + validToken;
    sut.handle(
      {
        headers: { Authorization: authToken },
        body: JSON.stringify({ message: "asdf" })
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull();
        expect(err.message).toEqual("type is not notifications");
        expect(err.code).toEqual(403);

        done();
      }
    );
    uportMgrMock.verifyToken.mockClear();
  });

  test("handle null body", done => {
    uportMgrMock.verifyToken = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve({ payload: { type: "othertype" } });
    });
    let authToken = "Bearer " + validToken;
    sut.handle({ headers: { Authorization: authToken } }, {}, (err, res) => {
      expect(err).not.toBeNull();
      expect(err.message).toContain("no json body");
      expect(err.code).toEqual(403);

      done();
    });
    uportMgrMock.verifyToken.mockClear();
  });
});
