const _test = require('tape-promise/tape');
const jsdom = require('jsdom');
const setup = require('../setup');
setup(jsdom);
module.exports = function (parent) {
  function test(desc, testFn) {
    _test(prependTestFile(desc), doTest(desc, testFn));
  }

  test.onFinish = _test.onFinish;
  test.skip = _test.skip;
  //eslint-disable-next-line no-only-tests/no-only-tests
  test.only = (desc, testFn) =>
    _test.only(prependTestFile(desc), doTest(desc, testFn));

  return test;

  function doTest(desc, fn) {
    return async (assert) => {
      await fn(assert);
    };
  }

  function prependTestFile(desc) {
    return `${parent.filename.replace(/.+?tests[/]/, ``)}\n${desc}`;
  }
};
