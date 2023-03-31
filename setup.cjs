/**
 * @typedef {import('jsdom').JSDOM} JSDOMT
 */

/**
 * @param {new (html?: string) => JSDOMT} JSDOM
 * @returns {void}
 */
function setup(JSDOM) {
  const jsdom = new JSDOM('');

  /** @type any */
  const globalAny = globalThis;

  // Assign the created `jsdom` instance to the global object. We need
  // to use `any` type when assigning to globalThis properties, because
  // TypeScript doesn't allow assigning to read-only properties. This
  // approach, however, keeps the typings for the rest of your code
  // intact.
  globalAny.jsdom = jsdom;

  // Assign the `window` property of the `jsdom` instance to the global
  // object. Using `any` type for the same reason as explained above.
  globalAny.window = jsdom.window;

  // Assign the `document` property of the `jsdom.window` instance to
  // the global object. Using `any` type for the same reason as
  // explained above.
  globalAny.document = jsdom.window.document;
}

module.exports = setup;
