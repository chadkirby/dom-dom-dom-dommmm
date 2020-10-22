const wrapper = require('./wrapper');
const { parse } = require('./helpers');
const DOM = require('./dom');

let $;

module.exports = {
  loadHtml: (html = ``) => wrapper(parse(html, "text/html")),

  loadXml: (xml = `<root />`) => wrapper(parse(xml, "text/xml")),

  get $() {
    if (!$) {
      $ = wrapper(DOM.document);
    }
    return $;
  },

  ...DOM,
  ...require('./helpers'),
  ...require('./splice-chars'),
  ...require('./tag-functions')

};


