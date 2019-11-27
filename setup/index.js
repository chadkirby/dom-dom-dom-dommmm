const globalThis = require('globalthis')();

module.exports = {
  setJSDOM({ JSDOM }) {
    if (!globalThis.DOM_DOM_JSDOM) {
      globalThis.DOM_DOM_JSDOM = JSDOM;
      globalThis.DOM_DOM_WINDOW = new globalThis.DOM_DOM_JSDOM('').window;
      globalThis.DOM_DOM_DOCUMENT = globalThis.DOM_DOM_WINDOW.document;
      return true;
    }
  },
  setCheerio(cheerio) {
    if (!globalThis.DOM_DOM_CHEERIO) {
      globalThis.DOM_DOM_CHEERIO = cheerio;
      return true;
    }
  }
};
