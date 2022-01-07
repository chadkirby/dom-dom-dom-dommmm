import _test from 'tape-promise/tape.js';
// eslint-disable-next-line no-unused-vars
import jsdom from './use-jsdom.js';
export default function (parent) {
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
}
