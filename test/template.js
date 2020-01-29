describe('moduleType.moduleName', function () {

  before(function() {
    // runs before all tests in this block
  });

  after(function() {
    // runs after all tests in this block
  });

  beforeEach(function() {
    // runs before each test in this block
  });

  afterEach(function() {
    // runs after each test in this block
  });

  describe('# functionName()', function () {
    it('function should bahave what', function (done) {
      const input = true;
      const expected = true;
      const actual = ((o) => o)(input); // call your target function here

      assert.deepEqual(actual, expected);
      done();
    });
  });

});