jest.mock("pg");
const { Client } = require('pg');
let pgClientMock = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};
Client.mockImplementation(() => {
  return pgClientMock;
});

const SnsMgr = require("../snsMgr");

describe("SnsMgr", () => {
  let sut;
  let senderId = 1234;
  let recipientId = 2345;
  let encmessage =
    '{"from":"efqzYJNqejlF25zY/LjtLmdGtiDiZbAxHlanINdVD38=","nonce":"5oVdrxgsUsk3cs/o1Y4KNv6eP2b6WO/r","ciphertext":"NOAeHyOvTvmV5BiYpeJwQAc3tIqc7xVcuxUIC9pGQsuXXUIQjDeyk7QdaNK4Us82oCE04FQndEPEPIMcHaZMpAHC74cEcX4PSpKmNAn98dqRtIUqF13fIwKkksxp3uOUZX6l9hQLGgZdYLQlT3nCODuBcemx9mm+1RdnCLIKow41krTbiAIozYfkrBL9L/cLN0NMP7zU42qhTOeYSu+lVl7LAEKtxWbapQXa7s17d7gRDyKgQu8zEJ5xotGVdV6wrfqWZ0TbrKftaO+CZb3LHnQX+aDBzu4LHxzji0vsDIeuj7EW1bkLzqjYnCK0ChJLxtd4a4p4xad0Wki7mRv4PmxcqGgxvo+zX6PAOu5z+bzxTa931rZFbBmG7FrzeafkzopZbnyLeaQKsX8oSRlBMeWOi6NRL4OpeCcCdomOtmc7peokBUiYMICo9qtOUH2A7nWKbpLHymR364XCEdg08JIUKcdPtIw+mzI+s3Len8ybHLlbhXgtdBBDQd/9rKYtWsLzz7ryAssQ1IYCq3WLE+aYtf306McDmWwXNgmr3NcbyaKPyWxSJ1E3NgmBPCpEV8kHQ4kVnu52+lbSQmNMyVy+hzGNSlG+68I78SUc2X/G4g=="}';
  let messagehash =
    "e37961d8153b209724520f48c7c1c781431302011de144425732be5f6bff23f2";

  const mockApp={
    getUser: jest.fn(),
    sendMessage: jest.fn()
  }

  beforeAll(() => {
    sut = new SnsMgr();
    //jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
  });

  test("empty constructor", () => {
    expect(sut).not.toBeUndefined();
  });

  test("storeMessage() fail if no pgUrl", done => {
    sut
      .storeMessage(messagehash, senderId, recipientId,encmessage)
      .then(resp => {
        fail("shouldn't return");
        done();
      })
      .catch(err => {
        expect(err.message).toEqual("no pgUrl set");
        done();
      });
  });

  test("getCountbyRecipient() fail if no pgUrl", done => {
    sut
      .getCountbyRecipient(recipientId)
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
      SNS_KEY_ID: "fakekey",
      SNS_KEY_SECRET: "fakesecret",
      ANDROID_ARN: "fake-android-arn",
      IOS_ARN: "fake-ios-arn",
      IOS_SANDBOX_ARN: "fake-ios_sandbox-arn",
      PG_URL: "faken-pg-url"
    });
    expect(sut.isSecretsSet()).toEqual(true);
  });

  describe("verifyEndpointArn()", ()=>{

    test("fail if no platform arn", done => {
      sut
        .verifyEndpointArn()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no platform application ARN");
          done();
        });
    });

    test("happy path (android)", done => {
      sut.verifyEndpointArn("fake-android-arn").then(resp => {
        expect(resp).not.toBeUndefined();
        expect(resp.platform).toEqual("ANDROID");
        expect(resp.getPlatformApplicationArn()).toEqual("fake-android-arn");
        done();
      });
    });

    
    test("happy path (ios)", done => {
      sut.verifyEndpointArn("fake-ios-arn").then(resp => {
        expect(resp).not.toBeUndefined();
        expect(resp.platform).toEqual("IOS");
        expect(resp.getPlatformApplicationArn()).toEqual("fake-ios-arn");
        done();
      });
    });

    test("happy path (ios_sandbox)", done => {
      sut.verifyEndpointArn("fake-ios_sandbox-arn").then(resp => {
        expect(resp).not.toBeUndefined();
        expect(resp.platform).toEqual("IOS");
        expect(resp.getPlatformApplicationArn()).toEqual("fake-ios_sandbox-arn");
        done();
      });
    });

  })

  describe("createMessage()", ()=>{
    test("fail if no senderId", done => {
      sut
        .createMessage()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no senderId");
          done();
        });
    });
  
    test("fail if no recipientId", done => {
      sut
        .createMessage(senderId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no recipientId");
          done();
        });
    });
  
    test("fail if no encmessage", done => {
      sut
        .createMessage(senderId, recipientId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no encmessage");
          done();
        });
    });
  
    test("fail if happy path", done => {
      pgClientMock.connect = jest.fn();
      pgClientMock.connect.mockClear();
      pgClientMock.end.mockClear();
      pgClientMock.query.mockClear();
      pgClientMock.query = jest.fn(() => {
        return Promise.resolve({ rows: ["ok"] });
      });
  
      sut
        .createMessage(senderId, recipientId, encmessage)
        .then(resp => {
          done();
        })
        .catch(err => {
          fail(err);
          done();
        });
    });
  
  })

  describe("storeMessage()", ()=>{
    test("fail if no message hash", done => {
      sut
        .storeMessage()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no message hash");
          done();
        });
    });
  
    test("fail if no sender id", done => {
      sut
        .storeMessage(messagehash)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no sender id");
          done();
        });
    });
  
    test("fail if no recipient id", done => {
      sut
        .storeMessage(messagehash, senderId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no recipient id");
          done();
        });
    });
  
    test("fail if no message", done => {
      sut
        .storeMessage(messagehash, senderId, recipientId)
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no encrypted message");
          done();
        });
    });

    test("handle query fail", done => {
      pgClientMock.query.mockImplementationOnce(() => { throw "error in query" });
      sut
        .storeMessage(messagehash, senderId, recipientId, encmessage)
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
        return Promise.resolve({ rows: ["ok"] });
      });
  
      sut
        .storeMessage(messagehash, senderId, recipientId, encmessage)
        .then(resp => {
          expect(pgClientMock.connect).toBeCalled();
          expect(pgClientMock.query).toBeCalled();
          expect(pgClientMock.query).toBeCalledWith(
            "INSERT INTO messages (id, sender, recipient, message) VALUES ($1, $2, $3, $4);",
            [messagehash, senderId, recipientId, encmessage]
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

  describe("getCountbyRecipient()", ()=>{
    test("fail if no recipientId", done => {
      sut
        .getCountbyRecipient()
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
        .getCountbyRecipient(recipientId)
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
        return Promise.resolve({ rows: [{ num: 5 }] });
      });
  
      sut
        .getCountbyRecipient(recipientId)
        .then(resp => {
          expect(pgClientMock.connect).toBeCalled();
          expect(pgClientMock.query).toBeCalled();
          expect(pgClientMock.query).toBeCalledWith(
            "SELECT count(*) as num FROM messages WHERE recipient = $1",
            [recipientId]
          );
          expect(pgClientMock.end).toBeCalled();
          expect(resp).toEqual(5);
          done();
        })
        .catch(err => {
          fail(err);
          done();
        });
    });
  })

  describe("getUser", ()=>{
    test("fail if no app", done => {
      sut
        .getUser()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no app");
          done();
        });
    });

    test("fail if no fullArn", done => {
      sut
        .getUser("a")
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no fullArn");
          done();
        });
    });

    test("handle app.getUser fail", done => {
      mockApp.getUser.mockImplementationOnce((f,cb)=>{
        cb("getUser error");
      })
      sut
        .getUser(mockApp,"f")
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err).toEqual("getUser error");
          done();
        });
    });

    test("happy path", done =>{
      mockApp.getUser.mockImplementationOnce((f,cb)=>{
        cb(null,{user: "data"})
      })
      sut
        .getUser(mockApp,"f")
        .then(resp => {
          expect(resp).toEqual({user: "data"});
          done();
        })
    })
  
  })

  describe("sendMessage", ()=>{
    test("fail if no app", done => {
      sut
        .sendMessage()
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no app");
          done();
        });
    });

    test("fail if no fullArn", done => {
      sut
        .sendMessage("a")
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no fullArn");
          done();
        });
    });

    test("fail if no msgPayload", done => {
      sut
        .sendMessage("a","f")
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err.message).toEqual("no msgPayload");
          done();
        });
    });

    test("handle app.sendMessage fail", done => {
      mockApp.sendMessage.mockImplementationOnce((f,m,cb)=>{
        cb("sendMessage error");
      })
      sut
        .sendMessage(mockApp,"f","p")
        .then(resp => {
          fail("shouldn't return");
          done();
        })
        .catch(err => {
          expect(err).toEqual("sendMessage error");
          done();
        });
    });

    test("happy path", done =>{
      mockApp.sendMessage.mockImplementationOnce((f,m,cb)=>{
        cb(null,"fakeMessageId")
      })
      sut
        .sendMessage(mockApp,"f","p")
        .then(resp => {
          expect(resp).toEqual("fakeMessageId");
          done();
        })
    })
  
  })
  
});
