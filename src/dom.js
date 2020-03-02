const globalThis = require('globalthis')();

let document = globalThis.document;
let window = globalThis.window;
let cheerio;

module.exports = {
  get document() {
    return document;
  },
  get window() {
    return window;
  },
  get cheerio() {
    return cheerio;
  },
  useJSDOM({ JSDOM }) {
    window = new JSDOM('').window;
    document = window.document;
  },
  setCheerio(CHEERIO) {
    cheerio = CHEERIO;
  }
};
