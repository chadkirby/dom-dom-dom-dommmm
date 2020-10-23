const { DOMArray } = require('./dom-array');
const { createFragment, fragmentToText, fragmentToHtml, isHtml } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');

module.exports = function(document, toHtml = () => false) {
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
    let html = toHtml(arg);
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
