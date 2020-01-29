describe("util.auth", function() {
  describe("# b64Encode()", function() {
    it("normal input should return encoded string", function(done) {
      const input = "abcdeABCDE";
      const expected = "YWJjZGVBQkNERQ==";
      const actual = util.auth.b64Encode(input);

      assert.deepEqual(actual, expected);

      done();
    });

    it("empty input should return just input", function(done) {
      const input = null;
      const expected = null;
      const actual = util.auth.b64Encode(input);

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# b64Decode()", function() {
    it("normal input should return decoded string", function(done) {
      const input = "YWJjZGVBQkNERQ==";
      const expected = "abcdeABCDE";
      const actual = util.auth.b64Decode(input);

      assert.deepEqual(actual, expected);

      done();
    });

    it("empty input should return just input", function(done) {
      const input = null;
      const expected = null;
      const actual = util.auth.b64Decode(input);

      assert.deepEqual(actual, expected);

      done();
    });
  });

  describe("# generatePassword()", function() {
    it("could generate 5 random password", function(done) {
      const input = 12;
      const expected = 12;

      _.each(_.times(5, _.constant(0)), (o, i) => {
        const pass = util.auth.generatePassword(input);
        const actual = _.size(pass);
        console.log(`generated ${i + 1} password: ${pass}`);
        assert.deepEqual(actual, expected);
      });

      done();
    });
  });

  describe("# verifyHash()", function() {
    it("could verifyHash", function(done) {
      const input = [
        [
          "111111aA!",
          "$2y$10$BKviv45C5eJDGM7mi3bL1OkjXruuxYtV9nTUkg2G48nGbfZOxSXHu"
        ],
        [
          "111111aA!",
          "$2y$10$3e7rqw9zwi5rGqA/cKqTp.jtHoxsZ0fqZfIHH6pJRdatAr5CndZxS"
        ],
        [
          "d8A=Bz-Q0=Ld@==9",
          "$2a$10$Y0t4vTKO3mF0WMNvUtz1S.DMAaR7.Bq5cxlcZWTRTf4W/LeksmkXy"
        ]
      ];

      _.each(input, (o, i) => {
        log(`verifying hash pair ${i}`);
        assert(util.auth.verifyHash(o[0], o[1]));
      });

      done();
    });
  });

  describe("# phpEncrypt() & phpDecrypt()", function() {
    it("verify phpDecrypt", function(done) {
      const input = [
        [
          "eyJpdiI6ImFiNlwvOEd5OGhrRWhncElkVExKNnVnPT0iLCJ2YWx1ZSI6IlhScEhDczBmdjR3WmhGczNJMGsySmc9PSIsIm1hYyI6IjZiNmNmMjU1ZDJiM2JlOGZiOWQwYWU1MDI1MzkzNWIzOGJjZDkyZDQ0OTIyY2NiYjhkYzhkZGRiZTYwMWI4YTkifQ==",
          "$5677980"
        ],
        [
          "eyJpdiI6Ikd6TEh5VUNaSEl5dTRFXC9TTnN3M2NBPT0iLCJ2YWx1ZSI6ImNCMm9XOHNIS2tCc0xBblNUU1k0aFlCMzBHenVDQlE4UW1yZE1JTzlQcEU9IiwibWFjIjoiYjUwZGQxMzlhODYxZjhjZmQ1NzU0ZWMzOThhZTMwNmJmMWIyMGU4Yjc5MDk4NDJkZTc4OTk1MjQ1MWY2ZmU4ZCJ9",
          "Pudh29bh_s*bV4"
        ],
        [
          "eyJpdiI6ImppRWNLZG14M3NPZW5NdkgxZkJ2a0E9PSIsInZhbHVlIjoiTlRsb09jdDdnbkVQbmdpak45NWtXRnBRXC9cL2ppWUJPWVN6TEJYV2s3RHpjPSIsIm1hYyI6ImYzZDk4YWRjNmJlOWFlMDc2NWZiMzJjNWEzNWI5OTZiY2MzMjIxMDdmMGZlYTQ0ZDY3YTY2YzQ2ZjdlYTdjNGMifQ==",
          "45511234778"
        ]
      ];

      _.each(input, (o, i) => {
        log(`verifying phpDecrypt pair ${i}`);
        assert.deepEqual(util.auth.phpDecrypt(o[0]), o[1]);
      });

      done();
    });

    it("verify phpEncrypt and phpDecrypt", function(done) {
      const input = ["JFHbo23bka892sC38", "xsw$kjl_-#sdabV4", "547830024531"];

      _.each(input, (o, i) => {
        log(`verifying phpEncrypt/phpDecrypt ${i}`);
        const encrypted = util.auth.phpEncrypt(o);
        log("encypted ---", encrypted);
        assert.deepEqual(util.auth.phpDecrypt(encrypted), o);
      });

      done();
    });
  });
});
