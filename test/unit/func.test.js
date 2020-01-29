describe("util.func", function() {
  describe("# modified lodash", function() {
    it("isEmpty should work as expected", function(done) {
      assert(_.isEmpty([]));
      assert(_.isEmpty({}));
      assert(_.isEmpty(null));
      assert(_.isEmpty(false));
      assert(_.isEmpty(0));
      assert(_.isEmpty(0.0));
      assert(_.isEmpty(""));
      assert(_.isEmpty(_.noop));
      assert(_.isEmpty(_.constant(1)));
      assert(_.isEmpty(_._does_not_exist));

      assert(!_.isEmpty(true));
      assert(!_.isEmpty(1));
      assert(!_.isEmpty(-1));
      assert(!_.isEmpty(100));
      assert(!_.isEmpty(new Date()));
      assert(!_.isEmpty("0"));
      assert(!_.isEmpty([0]));
      assert(
        !_.isEmpty({
          a: 0
        })
      );

      done();
    });

    it("upgrade should work as expected", function(done) {
      const inputStr = "new_value";
      const oldStr = "old_value";
      const inputObj = {
        new_key: oldStr
      };
      const expected = {
        new_key: inputStr,
        __new_key__: oldStr
      };
      const actual = _.upgrade(inputObj, "new_key", () => inputStr);

      assert.deepEqual(actual, expected);

      done();
    });

    it("deepDiff should work as expected", function(done) {
      const inputBase = {
        a: "a",
        b: "b",
        c: 1,
        d: {
          a: "a"
        },
        e: {
          a: "a",
          b: "b"
        },
        f: "f"
      };
      const inputTarget = {
        a: "_a",
        b: "b",
        c: 2,
        d: {
          a: "a"
        },
        e: {
          a: "a",
          b: "_b"
        },
        g: "g"
      };
      const expected = [
        {
          kind: "E",
          path: ["a"],
          lhs: "a",
          rhs: "_a"
        },
        {
          kind: "E",
          path: ["c"],
          lhs: 1,
          rhs: 2
        },
        {
          kind: "E",
          path: ["e", "b"],
          lhs: "b",
          rhs: "_b"
        },
        {
          kind: "D",
          path: ["f"],
          lhs: "f"
        },
        {
          kind: "N",
          path: ["g"],
          rhs: "g"
        }
      ];
      const actual = _.deepDiff(inputBase, inputTarget);

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# parseParams()", function() {
    it("parse parameter from a HTTP request like object", function(done) {
      const inputReq = {
        query: {
          key11: "val11",
          key12: "val12"
        },
        body: {
          key21: "val21",
          key22: "0.22"
        },
        other: {
          key31: 31,
          key32: 32,
          key33: {
            value: "33"
          }
        }
      };
      const inputMeta = {
        key_11: {
          from: "http",
          path: "key11"
        },
        key22: {
          from: "http",
          convert: "number"
        },
        key32: {
          from: "path",
          path: ["other", "key32"],
          convert: "safeInteger"
        },
        json: {
          from: "path",
          path: ["other", "key33"],
          convert: "stringify"
        }
      };
      const expected = {
        key_11: "val11",
        key22: 0.22,
        key32: 32,
        json: '{"value":"33"}'
      };
      const actual = util.func.parseParams(inputReq, inputMeta);

      assert.deepEqual(actual, expected);

      done();
    });
    it("parameter fallback should work", function(done) {
      const inputReq = {
        query: {
          key11: "val11",
          key12: "val12"
        },
        body: {
          key21: "val21",
          key22: "0.22"
        },
        other: {
          key31: 31,
          key32: 32,
          key33: {
            value: "33"
          }
        }
      };
      const inputMeta = {
        keyUnknown: {
          from: "http",
          path: "not_exist",
          defaultsTo: "defaultVal"
        }
      };
      const expected = {
        keyUnknown: "defaultVal"
      };
      const actual = util.func.parseParams(inputReq, inputMeta);

      assert.deepEqual(actual, expected);

      done();
    });
    it("email validator should work", function(done) {
      const inputReq = {
        emailValid: "123@abc.com",
        emailInvalid: "123~bad@abc_bad.com"
      };
      const inputMeta = {
        email: {
          from: "path",
          path: "emailValid",
          validator: "email"
        },
        badEmail: {
          from: "path",
          path: "emailInvalid"
        }
      };
      const expected = {
        email: "123@abc.com",
        badEmail: "123~bad@abc_bad.com"
      };
      const actual = util.func.parseParams(inputReq, inputMeta);
      assert.deepEqual(actual, expected);

      _.set(inputMeta, ["badEmail", "validator"], "email");
      try {
        util.func.parseParams(inputReq, inputMeta);
      } catch (ex) {
        assert.deepEqual(ex.message, `Invalid email - emailInvalid`);
      }

      done();
    });
    it("url validator should work", function(done) {
      const inputReq = {
        good: "http://go.sterlingnow.io/login/",
        bad: "http:-/-/go.sterlingnow.io/login/ ~bad"
      };
      const inputMeta = {
        good: {
          from: "path",
          validator: "url"
        },
        bad: {
          from: "path"
        }
      };
      const expected = {
        good: "http://go.sterlingnow.io/login/",
        bad: "http:-/-/go.sterlingnow.io/login/ ~bad"
      };
      const actual = util.func.parseParams(inputReq, inputMeta);
      assert.deepEqual(actual, expected);

      _.set(inputMeta, ["bad", "validator"], "url");
      try {
        util.func.parseParams(inputReq, inputMeta);
      } catch (ex) {
        assert.deepEqual(ex.message, `Invalid URL - bad`);
      }

      done();
    });
    it("regex validator should work", function(done) {
      const inputReq = {
        regValid: "123aaZZU1OpN",
        regInvalid: "983-&aZUw63@b"
      };
      const regex = /^[0-9a-zA-Z]+$/;
      const inputMeta = {
        good: {
          from: "path",
          path: "regValid",
          validator: "regex",
          regex
        },
        bad: {
          from: "path",
          path: "regInvalid"
        }
      };
      const expected = {
        good: "123aaZZU1OpN",
        bad: "983-&aZUw63@b"
      };
      const actual = util.func.parseParams(inputReq, inputMeta);
      assert.deepEqual(actual, expected);

      _.set(inputMeta, ["bad", "validator"], "regex");
      _.set(inputMeta, ["bad", "regex"], regex);
      try {
        util.func.parseParams(inputReq, inputMeta);
      } catch (ex) {
        assert.deepEqual(ex.message, `Is invalid - regInvalid`);
      }

      done();
    });
  });

  describe("# doNext()", function() {
    it("should execute resolve func when err==null", function(done) {
      const inputFunc = util.func.doNext(
        {},
        null,
        () => "resolve",
        () => "reject"
      );
      const expected = "resolve";
      const actual = inputFunc(null, {});

      assert.deepEqual(actual, expected);

      done();
    });

    it("should execute reject func when err!=null", function(done) {
      const inputFunc = util.func.doNext(
        {},
        null,
        () => "resolve",
        () => "reject"
      );
      const expected = "reject";
      const actual = inputFunc({}, {});

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# doResponse()", function() {
    it("should execute ok func when err==null", function(done) {
      const inputRes = {
        resolve: () => "ok",
        reject: () => "error"
      };
      const expected = "ok";
      const actual = util.func.doResponse(inputRes)(null, {});

      assert.deepEqual(actual, expected);

      done();
    });

    it("should execute negotiate func when err!=null", function(done) {
      const inputRes = {
        resolve: () => "ok",
        reject: () => "error"
      };
      const expected = "error";
      const actual = util.func.doResponse(inputRes)({}, {});

      assert.deepEqual(actual, expected);

      done();
    });

    it("should execute 400 with known response error", function(done) {
      const inputRes = {
        resolve: () => "ok",
        reject: () => "error",
        badRequest: body => body
      };
      const expected = "400_body";
      const actual = util.func.doResponse(inputRes)(
        util.func.setResponseError("400", expected),
        {}
      );

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# sync()", function() {
    it("should sync the async function, and return the callback value", function(done) {
      const expected = "ok";
      const actual = util.func.sync(next => {
        setTimeout(() => {
          next(null, expected);
        }, 500);
      }, _.stubTrue);

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# isAsync()", function() {
    it("should check async function", function(done) {
      const expected = true;
      const actual = util.func.isAsync(async x => x);

      assert.deepEqual(actual, expected);

      done();
    });

    it("should check not async function", function(done) {
      const expected = false;
      const actual = util.func.isAsync(x => x);

      assert.deepEqual(actual, expected);

      done();
    });
  });
});
