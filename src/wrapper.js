const globalThis = require('globalthis')();
const { DOMArray } = require('./dom-array');
const { createFragment, fragmentToText, fragmentToHtml } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');

module.exports = function(document) {
  function $(arg) {
    if (!arg) {
      return DOMArray.of();
    }
    if (Array.isArray(arg)) {
      return DOMArray.from(arg);
    }
    if (isEl(arg) || isTextNode(arg)) {
      return DOMArray.of(arg);
    }
    if (arg.cheerio === `[cheerio object]`) {
      // adopt a cheerio instance, but we need the outerHTML & that's not easy to
      // get...
      arg = getCheerioHtml(arg);
    }
    if (typeof arg === `string`) {
      let doc = createFragment(arg, document);
      return DOMArray.from(doc.childNodes);
    }
  }

  Object.assign($, {
    query(selector) {
      let found = document.querySelector(selector);
      return found ? DOMArray.of(found) : DOMArray.of();
    },
    queryAll(selector) {
      return DOMArray.from(document.querySelectorAll(selector));
    },
    html(selector) {
      if (typeof selector === `string`) {
        return DOMArray.from(document.querySelectorAll(selector)).outerHtml();
      }
      return fragmentToHtml(document);
    },
    text(selector) {
      if (typeof selector === `string`) {
        return DOMArray.from(document.querySelectorAll(selector)).text();
      }
      return fragmentToText(document);
    }
  });

  return $;
};

let CHEERIO_OUTER_HTML;
function getCheerioHtml($html) {
  if (!CHEERIO_OUTER_HTML) {
    if (globalThis.DOM_DOM_CHEERIO) {
      CHEERIO_OUTER_HTML = globalThis.DOM_DOM_CHEERIO.load().html;
    } else {
      CHEERIO_OUTER_HTML = ($ht) => $ht.clone().wrap(`<div />`).parent().html();
    }
  }
  return CHEERIO_OUTER_HTML($html);
}
