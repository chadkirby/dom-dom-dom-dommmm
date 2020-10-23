const globalThis = require('globalthis')();

let document = globalThis.document;
let window = globalThis.window;
let cheerio;
let jsdom;

module.exports = {
  get document() {
    return document;
  },
  get window() {
    return window;
  },
  get jsdom() {
    return jsdom;
  },
  get cheerio() {
    return cheerio;
  },
  useJSDOM({ JSDOM }) {
    jsdom = new JSDOM('');
    window = jsdom.window;
    document = window.document;
  },
  setCheerio(CHEERIO) {
    cheerio = CHEERIO;
  }
};
