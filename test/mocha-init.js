const util = require("../index");
const chai = require("chai");
const { assert, expect, should } = chai;

before(function(done) {
  console.log("-------- node-util TEST START --------");
  // Increase the Mocha timeout
  this.timeout(10000);

  process.env.NODE_ENV = "test";

  // init the context
  util.init(global);

  chai.config.showDiff = true;
  chai.config.includeStack = true;

  _.upgrade(global, "assert", () => assert);
  _.upgrade(global, "expect", () => expect);
  _.upgrade(global, "should", () => should());

  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  console.log("-------- node-util TEST DONE! --------");
  done();
});
