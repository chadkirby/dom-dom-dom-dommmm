const globalThis = require('globalthis')();
const wrapper = require('../src/wrapper');

module.exports = {
  load(html = ``) {
    const document = new globalThis.DOMParser().parseFromString(html, "text/html");
    return wrapper(document);
  },
  loadXml(xml = `<?xml version="1.0" encoding="utf-8" ?><root />`) {
    const document = new globalThis.DOMParser().parseFromString(xml, "text/xml");
    return wrapper(document);
  }
};
