const wrapper = require('./wrapper');
const { parse } = require('./helpers');
const DOM = require('./dom');

let $;

module.exports = {
  loadHtml: (html = ``, { toHtml } = {}) => wrapper(parse(html, "text/html"), toHtml),

  loadXml: (xml = `<root />`, { toHtml } = {}) => wrapper(parse(xml, "text/xml"), toHtml),

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


