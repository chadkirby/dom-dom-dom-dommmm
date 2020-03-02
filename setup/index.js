const { useJSDOM, setCheerio } = require('../src/dom');


module.exports = {
  setJSDOM(jsdom) {
    useJSDOM(jsdom);
  },
  setCheerio(cheerio) {
    setCheerio(cheerio);
  }
};
