const globalThis = require('globalthis')();

module.exports = (dom) => {
  if (dom && dom.JSDOM) {
    globalThis.DOM_DOM_JSDOM = dom.JSDOM;
    globalThis.DOM_DOM_WINDOW = new globalThis.DOM_DOM_JSDOM('').window;
    globalThis.DOM_DOM_DOCUMENT = globalThis.DOM_DOM_WINDOW.document;
  } else {
    throw new Error(`unknown dom`);
  }
};
