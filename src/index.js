const globalThis = require('globalthis')();
const isNode = require('is-node');
const isElectron = require('is-electron')();

const wrapper = require('./wrapper');

const globalDocument = globalThis.document || globalThis.DOM_DOM_DOCUMENT;

let loadHtml;
let loadXml;

if (isNode && !isElectron) {
  const JSDOM = globalThis.DOM_DOM_JSDOM;

  loadHtml = (html = ``) => {
    const dom = new JSDOM(html, {
      contentType: "text/html"
    });
    return wrapper(dom.window.document);
  };

  loadXml = (xml = `<?xml version="1.0" encoding="utf-8" ?><root />`) => {
    const dom = new JSDOM(xml, {
      contentType: "text/xml"
    });
    return wrapper(dom.window.document);
  };

} else {
  const DOMParser = globalThis.DOMParser;

  loadHtml = (html = ``) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return wrapper(document);
  };

  loadXml = (xml = `<?xml version="1.0" encoding="utf-8" ?><root />`) => {
    const document = new DOMParser().parseFromString(xml, "text/xml");
    return wrapper(document);
  };

}

module.exports = {
  ...require('./helpers'),
  ...require('./splice-chars'),
  ...require('./tag-functions'),
  loadHtml,
  loadXml,
  $: wrapper(globalDocument)
};
