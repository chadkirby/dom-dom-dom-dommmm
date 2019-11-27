const globalThis = require('globalthis')();

const wrapper = require('./wrapper');

const globalDocument = globalThis.DOM_DOM_DOCUMENT || globalThis.document;
const globalWindow = globalThis.DOM_DOM_WINDOW || globalThis.window;
const DOMParser = globalWindow.DOMParser;

module.exports = {
  ...require('./helpers'),
  ...require('./splice-chars'),
  ...require('./tag-functions'),
  loadHtml(html = ``) {
    const document = new DOMParser().parseFromString(html, "text/html");
    return wrapper(document);
  },
  loadXml(xml = `<?xml version="1.0" encoding="utf-8" ?><root />`) {
    const document = new DOMParser().parseFromString(xml, "text/xml");
    return wrapper(document);
  },
  $: wrapper(globalDocument)
};
