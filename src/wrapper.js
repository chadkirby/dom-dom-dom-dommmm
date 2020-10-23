const { DOMArray } = require('./dom-array');
const { createFragment, fragmentToText, fragmentToHtml, isHtml } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');
const { cheerio } = require('./dom');
let cheerio$;

module.exports = function(document) {
  function $(arg) {
    if (!arg) {
      return DOMArray.of();
    }
    if (arg.isDOMArray) {
      return arg;
    }
    if (Array.isArray(arg)) {
      return DOMArray.from(arg);
    }
    if (isEl(arg) || isTextNode(arg)) {
      return DOMArray.of(arg);
    }
    if (typeof arg === `string`) {
      if (isHtml(arg)) {
        let fragment = createFragment(arg, document);
        return DOMArray.from(fragment.childNodes);
      }
      return DOMArray.from(document.querySelectorAll(arg));
    }
    let html;
    if (arg.cheerio === `[cheerio object]`) {
      // adopt a cheerio instance, but we need the outerHTML & that's
      // not easy to get...
      html = getCheerioHtml(arg);
    } else if (cheerio && [ 'type', 'name', 'attribs', 'parent' ].every(
      (p) => arg.hasOwnProperty(p) // eslint-disable-line no-prototype-builtins
    )) {
      // adopt a cheerio DOM object
      cheerio$ = cheerio$ || cheerio.load('<html />');
      html = cheerio$.html(arg);
    }
    if (html) {
      return DOMArray.from(createFragment(html, document).childNodes);
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
    html(thing) {
      if (typeof thing === 'string') {
        return DOMArray.from(document.querySelectorAll(thing)).outerHtml();
      }
      if (DOMArray.isDOMArray(thing)) {
        return thing.outerHtml();
      }
      return fragmentToHtml(document);
    },
    text(selector) {
      if (selector) {
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
    if (cheerio) {
      CHEERIO_OUTER_HTML = cheerio.load(``).html;
    } else {
      CHEERIO_OUTER_HTML = ($ht) => $ht.clone().wrap(`<div />`).parent().html();
    }
  }
  return CHEERIO_OUTER_HTML($html);
}
