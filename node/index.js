const globalThis = require('globalthis')();
const { DOM_DOM_JSDOM: JSDOM } = globalThis;
const wrapper = require('../src/wrapper');

module.exports = {
  load(html = ``) {
    const dom = new JSDOM(html, {
      contentType: "text/html"
    });
    return wrapper(dom.window.document);
  },
  loadXml(xml = `<?xml version="1.0" encoding="utf-8" ?><root />`) {
    const dom = new JSDOM(xml, {
      contentType: "text/xml"
    });
    return wrapper(dom.window.document);
  }
};
