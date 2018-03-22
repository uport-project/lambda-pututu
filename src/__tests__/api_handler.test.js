import AWS from "aws-sdk";
import MockAWS from "aws-sdk-mock";
MockAWS.setSDKInstance(AWS);

const apiHandler = require("../api_handler");

describe("apiHandler", () => {
  beforeAll(() => {
    MockAWS.mock("KMS", "decrypt", Promise.resolve({ Plaintext: "{}" }));
    process.env.SECRETS = "badSecret";
  });

  test("sns()", done => {
    apiHandler.sns({}, {}, (err, res) => {
      expect(err).toBeNull();
      expect(res).not.toBeNull();

      done();
    });
  });

  test("message_get()", done => {
    apiHandler.message_get({}, {}, (err, res) => {
      expect(err).toBeNull();
      expect(res).not.toBeNull();

      done();
    });
  });

  test("message_delete()", done => {
    apiHandler.message_delete({}, {}, (err, res) => {
      expect(err).toBeNull();
      expect(res).not.toBeNull();

      done();
    });
  });
});
