const wrapper = require('./wrapper');
const { parse } = require('./helpers');
const { document } = require('./dom');

exports.loadHtml = (html = ``) => wrapper(parse(html, "text/html"));

exports.loadXml = (xml = `<root />`) => wrapper(parse(xml, "text/xml"));

exports.$ = wrapper(document);

Object.assign(
  exports,
  require('./dom'),
  require('./helpers'),
  require('./splice-chars'),
  require('./tag-functions')
);
