const globalThis = require('globalthis')();

const wrapper = require('./wrapper');

exports.document = globalThis.DOM_DOM_DOCUMENT || globalThis.document;
exports.window = globalThis.DOM_DOM_WINDOW || globalThis.window;

const DOMParser = exports.window.DOMParser;
exports.parse = (string, contentType) => new DOMParser().parseFromString(
  string,
  contentType
);

exports.loadHtml = (html = ``) => wrapper(exports.parse(html, "text/html"));

exports.loadXml = (xml = `<root />`) => wrapper(exports.parse(xml, "text/xml"));

exports.$ = wrapper(exports.document);

Object.assign(
  exports,
  require('./helpers'),
  require('./splice-chars'),
  require('./tag-functions')
);
